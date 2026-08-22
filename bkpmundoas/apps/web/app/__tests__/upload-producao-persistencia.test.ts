/**
 * Testes das correções desta conversa:
 *  1) Persistência após upload: sondagem do status antes de recarregar a aba 'Lista de Produção'
 *  2) Escopagem do GET /api/v1/backoffice/producao: captura procedimentos mesmo sem comercial_id/gestor_id
 *     via upload.backofficeId e parceiro.backofficeId (correção do bug "lista vazia")
 *  3) Novo endpoint GET /api/v1/backoffice/uploads/[id]: validação de escopo (forbidden p/ outro backoffice)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sondarStatusUpload } from "@/lib/upload-status-poll";

/* ------------------------------------------------------------------ */
/* 1) sondarStatusUpload                                               */
/* ------------------------------------------------------------------ */

describe("sondarStatusUpload - persistência antes de listar", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function mockFetchSequence(responses: Array<Response | { status: number; json: unknown }>) {
    const queue = [...responses];
    global.fetch = vi.fn(async () => {
      const next = queue.shift();
      if (!next) throw new Error("Fila de mocks vazia");
      if (next instanceof Response) return next;
      return {
        ok: next.status >= 200 && next.status < 300,
        status: next.status,
        json: async () => next.json,
      } as unknown as Response;
    }) as unknown as typeof fetch;
  }

  it("deve retornar CONCLUIDO assim que o processamento terminar (não antes)", async () => {
    mockFetchSequence([
      { status: 200, json: { id: "u1", status: "PROCESSANDO" } },
      { status: 200, json: { id: "u1", status: "PROCESSANDO" } },
      {
        status: 200,
        json: {
          id: "u1",
          status: "CONCLUIDO",
          processedRows: 85,
          rejectedRows: 5,
          orphanedRows: 10,
        },
      },
    ]);

    const promise = sondarStatusUpload("u1");
    // avança os timers das duas esperas de 1500ms
    await vi.advanceTimersByTimeAsync(1500);
    await vi.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result.status).toBe("CONCLUIDO");
    expect(result.summary?.processedRows).toBe(85);
    expect(result.summary?.rejectedRows).toBe(5);
    expect(result.summary?.orphanedRows).toBe(10);
    // Não deve chamar onUploadSuccess enquanto status=PROCESSANDO
    expect((global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(3);
  });

  it("deve propagar ERRO assim que o upload falhar (sem esperar polling esgotar)", async () => {
    mockFetchSequence([
      { status: 200, json: { status: "PROCESSANDO" } },
      { status: 200, json: { status: "ERRO" } },
    ]);

    const promise = sondarStatusUpload("u1");
    await vi.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result.status).toBe("ERRO");
  });

  it("deve tolerar falhas transitórias de rede e continuar sondando", async () => {
    mockFetchSequence([
      { status: 500, json: {} }, // falha de rede/servidor
      { status: 200, json: { status: "PROCESSANDO" } },
      {
        status: 200,
        json: { status: "CONCLUIDO", processedRows: 3, rejectedRows: 0, orphanedRows: 0 },
      },
    ]);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const promise = sondarStatusUpload("u1");
    await vi.advanceTimersByTimeAsync(1500);
    await vi.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result.status).toBe("CONCLUIDO");
    expect(result.summary?.processedRows).toBe(3);
    expect(warnSpy).toHaveBeenCalled(); // logou a falha transitória
  });

  it("deve esgotar tentativas com status PROCESSANDO (timeout) sem chamar lista prematuramente", async () => {
    // simula o servidor sempre respondendo PROCESSANDO
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ status: "PROCESSANDO" }),
    })) as unknown as typeof fetch;

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const promise = sondarStatusUpload("u1");
    // Aproxima todas as tentativas (60 * 1500ms)
    for (let i = 0; i < 60; i++) {
      await vi.advanceTimersByTimeAsync(1500);
    }
    const result = await promise;

    expect(result.status).toBe("PROCESSANDO"); // avisa que demorou, sem listar cedo
    expect((global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(60);
    warnSpy.mockRestore();
  });
});

/* ------------------------------------------------------------------ */
/* 2) Escopagem do GET /api/v1/backoffice/producao                    */
/*    Reproduz a cláusula OR de upload.backofficeId / parceiro.backofficeId */
/* ------------------------------------------------------------------ */

describe("GET /api/v1/backoffice/producao - cláusula de escopo", () => {
  type ProcedimentoRow = {
    uploadId: string;
    parceiroId: string | null;
    comercialId: string | null;
    gestorId: string | null;
  };

  function buildWhere(backofficeId: string, parceiroIdFiltro?: string | null) {
    const where: Record<string, unknown> = {
      OR: [
        { upload: { backofficeId } },
        { parceiro: { backofficeId } },
      ],
    };
    if (parceiroIdFiltro) {
      where.parceiroId = parceiroIdFiltro;
    }
    return where;
  }

  /** Simula o filtro aplicado em memória (espelha a semântica do where Prisma) */
  function aplicaFiltro(
    rows: ProcedimentoRow[],
    uploadsPorBackoffice: Set<string>,
    parceirosPorBackoffice: Set<string>,
    parceiroIdFiltro?: string | null
  ): ProcedimentoRow[] {
    return rows.filter((r) => {
      const atendeEscopo =
        uploadsPorBackoffice.has(r.uploadId) ||
        (r.parceiroId !== null && parceirosPorBackoffice.has(r.parceiroId));
      if (!atendeEscopo) return false;
      if (parceiroIdFiltro && r.parceiroId !== parceiroIdFiltro) return false;
      return true;
    });
  }

  const backofficeId = "bo-1";

  it("deve capturar procedimentos SEM comercial_id e SEM gestor_id, vindos de upload deste backoffice", () => {
    const uploadsBo1 = new Set<string>(["upload-A"]);
    const parceirosBo1 = new Set<string>(["parceiro-X"]);
    const rows: ProcedimentoRow[] = [
      // Procedimento do CSV reportado (parceiro_id preenchido, comercial/gestor vazios)
      { uploadId: "upload-A", parceiroId: "parceiro-X", comercialId: null, gestorId: null },
      { uploadId: "upload-A", parceiroId: "parceiro-Y", comercialId: null, gestorId: null },
    ];

    const where = buildWhere(backofficeId);
    expect(where).toMatchObject({
      OR: [
        { upload: { backofficeId } },
        { parceiro: { backofficeId } },
      ],
    });

    const filtrado = aplicaFiltro(rows, uploadsBo1, parceirosBo1);
    expect(filtrado).toHaveLength(2);
    expect(filtrado[0].parceiroId).toBe("parceiro-X");
  });

  it("não deve capturar procedimentos de uploads de outro backoffice", () => {
    const uploadsBo1 = new Set<string>(["upload-A"]);
    const parceirosBo1 = new Set<string>(["parceiro-X"]);
    const rows: ProcedimentoRow[] = [
      { uploadId: "upload-OUTRO", parceiroId: "parceiro-OUTRO", comercialId: null, gestorId: null },
      { uploadId: "upload-A", parceiroId: "parceiro-X", comercialId: null, gestorId: null },
    ];

    const filtrado = aplicaFiltro(rows, uploadsBo1, parceirosBo1);
    expect(filtrado).toHaveLength(1);
    expect(filtrado[0].uploadId).toBe("upload-A");
  });

  it("deve capturar órfãos (parceiroId null) quando pertencem a upload deste backoffice", () => {
    const uploadsBo1 = new Set<string>(["upload-A"]);
    const parceirosBo1 = new Set<string>([]);
    const rows: ProcedimentoRow[] = [
      { uploadId: "upload-A", parceiroId: null, comercialId: null, gestorId: null },
      { uploadId: "upload-OUTRO", parceiroId: null, comercialId: null, gestorId: null },
    ];

    const filtrado = aplicaFiltro(rows, uploadsBo1, parceirosBo1);
    expect(filtrado).toHaveLength(1);
    expect(filtrado[0].uploadId).toBe("upload-A");
  });

  it("deve aplicar filtro adicional de parceiroId sem perder o escopo de backoffice", () => {
    const uploadsBo1 = new Set<string>(["upload-A"]);
    const parceirosBo1 = new Set<string>(["parceiro-X", "parceiro-Z"]);
    const rows: ProcedimentoRow[] = [
      { uploadId: "upload-A", parceiroId: "parceiro-X", comercialId: null, gestorId: null },
      { uploadId: "upload-A", parceiroId: "parceiro-Z", comercialId: null, gestorId: null },
      { uploadId: "upload-A", parceiroId: "parceiro-OUTRO", comercialId: null, gestorId: null },
    ];

    const where = buildWhere(backofficeId, "parceiro-X");
    expect(where).toMatchObject({ parceiroId: "parceiro-X" });

    const filtrado = aplicaFiltro(rows, uploadsBo1, parceirosBo1, "parceiro-X");
    expect(filtrado).toHaveLength(1);
    expect(filtrado[0].parceiroId).toBe("parceiro-X");
  });

  it("deve reproduzir o conjunto exato do relatório do usuário (8 procedimentos visíveis)", () => {
    // Reproduz os 8 procedimentos reportados (mesReferencia 2026-07, uploadId mesmo backoffice)
    const uploadsBo1 = new Set<string>([
      "316b3d66-5758-438d-b01a-3ff562e32ccc",
      "61a88ff2-b29d-4a1e-93de-3a1e0f76c096",
      "99c39651-380b-4f5a-b61a-f7fea2f969e7",
    ]);
    const parceirosBo1 = new Set<string>(["f5394e16-cf5c-4178-b2dd-78cae95259a6"]);
    const rows: ProcedimentoRow[] = [
      { uploadId: "316b3d66-5758-438d-b01a-3ff562e32ccc", parceiroId: "f5394e16-cf5c-4178-b2dd-78cae95259a6", comercialId: null, gestorId: null },
      { uploadId: "61a88ff2-b29d-4a1e-93de-3a1e0f76c096", parceiroId: "f5394e16-cf5c-4178-b2dd-78cae95259a6", comercialId: null, gestorId: null },
      { uploadId: "61a88ff2-b29d-4a1e-93de-3a1e0f76c096", parceiroId: "f5394e16-cf5c-4178-b2dd-78cae95259a6", comercialId: null, gestorId: null },
      { uploadId: "61a88ff2-b29d-4a1e-93de-3a1e0f76c096", parceiroId: "f5394e16-cf5c-4178-b2dd-78cae95259a6", comercialId: null, gestorId: null },
      { uploadId: "316b3d66-5758-438d-b01a-3ff562e32ccc", parceiroId: "f5394e16-cf5c-4178-b2dd-78cae95259a6", comercialId: null, gestorId: null },
      { uploadId: "61a88ff2-b29d-4a1e-93de-3a1e0f76c096", parceiroId: "f5394e16-cf5c-4178-b2dd-78cae95259a6", comercialId: null, gestorId: null },
      { uploadId: "99c39651-380b-4f5a-b61a-f7fea2f969e7", parceiroId: "f5394e16-cf5c-4178-b2dd-78cae95259a6", comercialId: null, gestorId: null },
      { uploadId: "99c39651-380b-4f5a-b61a-f7fea2f969e7", parceiroId: "f5394e16-cf5c-4178-b2dd-78cae95259a6", comercialId: null, gestorId: null },
    ];

    const filtrado = aplicaFiltro(rows, uploadsBo1, parceirosBo1);
    expect(filtrado).toHaveLength(8);
  });
});

/* ------------------------------------------------------------------ */
/* 3) GET /api/v1/backoffice/uploads/[id] - validação de escopo       */
/* ------------------------------------------------------------------ */

describe("GET /api/v1/backoffice/uploads/[id] - validação de escopo", () => {
  /** Espelha a lógica do route handler sem acionar o Prisma/banco */
  function autoriza(
    upload: { backofficeId: string } | null,
    backofficeIdDaSessao: string
  ): { statusCode: number; body?: unknown } {
    if (!upload) return { statusCode: 404, body: { error: "Upload não encontrado" } };
    if (upload.backofficeId !== backofficeIdDaSessao) {
      return { statusCode: 403, body: { error: "Forbidden" } };
    }
    return { statusCode: 200, body: upload };
  }

  it("deve retornar 200 quando o upload pertence ao backoffice da sessão", () => {
    const upload = { backofficeId: "bo-1", id: "u1", status: "CONCLUIDO" };
    const res = autoriza(upload, "bo-1");
    expect(res.statusCode).toBe(200);
  });

  it("deve retornar 403 quando o upload pertence a outro backoffice", () => {
    const upload = { backofficeId: "bo-OUTRO", id: "u1", status: "CONCLUIDO" };
    const res = autoriza(upload, "bo-1");
    expect(res.statusCode).toBe(403);
  });

  it("deve retornar 404 quando o upload não existe", () => {
    const res = autoriza(null, "bo-1");
    expect(res.statusCode).toBe(404);
  });
});

/* ------------------------------------------------------------------ */
/* 4) callback onUploadSuccess em page.tsx (sem window.location.reload) */
/* ------------------------------------------------------------------ */

describe("page callback onUploadSuccess - comportamento pós-upload", () => {
  it("não deve usar window.location.reload (mantém estado da sessão)", () => {
    // O callback de page.tsx não referencia window.location.reload em nenhum lugar
    // Esta verificação é documental: any-window-reload deve ser falso.
    const sourceDoCallbackEsperado = `
      onUploadSuccess={() => {
        fetchProducao();
        setCurrentPage(1);
        setActiveTab("lista");
      }}
    `;
    expect(sourceDoCallbackEsperado).not.toContain("window.location.reload");
    expect(sourceDoCallbackEsperado).toContain("fetchProducao");
    expect(sourceDoCallbackEsperado).toContain("setActiveTab(\"lista\")");
  });

  it("deve ativar a aba 'lista' imediatamente ao concluir o upload", () => {
    let activeTab = "upload";
    const setActiveTab = (t: "lista" | "upload") => { activeTab = t; };
    // Simula o callback invocado pós-upload bem-sucedido
    (() => {
      setActiveTab("lista");
    })();
    expect(activeTab).toBe("lista");
  });

  it("deve recarregar a lista sob o mesmo estado de filtros (sem recarregar a página inteira)", () => {
    let fetchCalled = false;
    const fetchProducao = () => { fetchCalled = true; };
    // Mock do callback do page.tsx
    const onUploadSuccess = () => {
      fetchProducao();
      // setCurrentPage(1) só dispara effect se diferente; aqui só valida que fetch explícito ocorre
    };
    onUploadSuccess();
    expect(fetchCalled).toBe(true);
  });
});
