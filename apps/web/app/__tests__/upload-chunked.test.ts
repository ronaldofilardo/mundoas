import {
  montarIndicesDeHeaders,
} from "@/lib/processar-upload-pf/processar-lote";
import {
  executarComRetry,
  CHUNK_SIZE,
  executarUploadChunked,
  type ProgressoUpload,
  type FalhaLoteInfo,
} from "@/components/backoffice/upload-chunked-client";

describe("Upload em Lotes (Chunking) - processar-lote helpers", () => {
  it("montarIndicesDeHeaders deve mapear colunas obrigatórias e opcionais", () => {
    const headersRaw = [
      "Data de Referência",
      "Paciente",
      "CPF",
      "Procedimento",
      "Usuário da conta",
      "Unidade",
      "Tipo Procedimento",
      "Total Pago",
    ];

    const idxs = montarIndicesDeHeaders(headersRaw);

    expect(idxs.idxDataRef).toBe(0);
    expect(idxs.idxPaciente).toBe(1);
    expect(idxs.idxCpf).toBe(2);
    expect(idxs.idxProcedimento).toBe(3);
    expect(idxs.idxUsuarioConta).toBe(4);
    expect(idxs.idxUnidade).toBe(5);
    expect(idxs.idxTipoProcedimento).toBe(6);
    expect(idxs.idxValorTotal).toBe(7);
  });

  it("montarIndicesDeHeaders deve falhar se coluna financeira faltar", () => {
    const headersRaw = ["Data de Referência", "Paciente", "Procedimento", "Usuário da conta"];

    expect(() => montarIndicesDeHeaders(headersRaw)).toThrow(
      /Coluna financeira obrigatória faltando/,
    );
  });

  it("CHUNK_SIZE padrão deve ser 250 para manter execução segura na Vercel", () => {
    expect(CHUNK_SIZE).toBe(250);
  });
});

describe("Upload em Lotes (Chunking) - retry e resiliência", () => {
  it("executarComRetry deve retornar resultado na primeira tentativa se tiver sucesso", async () => {
    const operacao = vi.fn().mockResolvedValue("sucesso");

    const resultado = await executarComRetry(operacao, 3, 10);

    expect(resultado).toBe("sucesso");
    expect(operacao).toHaveBeenCalledTimes(1);
  });

  it("executarComRetry deve tentar novamente em caso de falha transitória e ter sucesso", async () => {
    let tentativa = 0;
    const operacao = vi.fn().mockImplementation(async () => {
      tentativa++;
      if (tentativa < 2) {
        throw new Error("Timeout 504 transitório");
      }
      return "sucesso_apos_retry";
    });

    const resultado = await executarComRetry(operacao, 3, 10);

    expect(resultado).toBe("sucesso_apos_retry");
    expect(operacao).toHaveBeenCalledTimes(2);
  });

  it("executarComRetry deve lançar erro se esgotar todas as tentativas", async () => {
    const operacao = vi.fn().mockRejectedValue(new Error("Erro de conexão persistente"));

    await expect(executarComRetry(operacao, 3, 10)).rejects.toThrow(
      "Erro de conexão persistente",
    );
    expect(operacao).toHaveBeenCalledTimes(3);
  });

  it("executarComRetry não deve tentar novamente se for erro 4xx do cliente", async () => {
    const operacao = vi.fn().mockRejectedValue(new Error("HTTP_CLIENT_ERROR: Dados inválidos"));

    await expect(executarComRetry(operacao, 3, 10)).rejects.toThrow(
      "HTTP_CLIENT_ERROR: Dados inválidos",
    );
    expect(operacao).toHaveBeenCalledTimes(1);
  });
});

describe("Upload em Lotes (Chunking) - executarUploadChunked orquestrador", () => {
  it("deve dividir dados em lotes e emitir eventos de progresso", async () => {
    const XLSX = await import("xlsx");
    const headers1 = ["Cabeçalho 1"];
    const headers2 = [
      "Data de Referência",
      "Paciente",
      "CPF",
      "Procedimento",
      "Usuário da conta",
      "Unidade",
      "Tipo Procedimento",
      "Total Pago",
    ];
    // Criar 300 linhas de dados (deve gerar 2 lotes: 250 + 50)
    const dados = Array.from({ length: 300 }, (_, i) => [
      "2026-07-01",
      `Paciente ${i}`,
      "12345678901",
      "Consulta",
      "usuario1",
      "Matriz",
      "ROTINA",
      100,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers1, headers2, ...dados]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const file = new File([buffer], "teste_chunk.xlsx");

    const chamadasLotes: any[] = [];
    const progressos: ProgressoUpload[] = [];

    const mockFetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
      const body = JSON.parse(opts.body);
      if (url.includes("/chunked/iniciar")) {
        return {
          ok: true,
          text: async () => JSON.stringify({ uploadId: "upload-uuid-123" }),
        };
      }
      if (url.includes("/chunked/lote")) {
        chamadasLotes.push(body);
        return {
          ok: true,
          text: async () => JSON.stringify({ sucesso: true, loteIndex: body.loteIndex }),
        };
      }
      if (url.includes("/chunked/finalizar")) {
        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              status: "CONCLUIDO",
              id: "upload-uuid-123",
              summary: { totalRows: 300, processedRows: 300 },
            }),
        };
      }
      return { ok: false, text: async () => "Rota não encontrada" };
    });

    global.fetch = mockFetch as any;

    const resultado = await executarUploadChunked({
      file,
      mesReferencia: "2026-07",
      onProgresso: (p) => progressos.push(p),
    });

    expect(resultado.concluido).toBe(true);
    // 300 linhas com CHUNK_SIZE=250 gera 2 lotes
    expect(chamadasLotes.length).toBe(2);
    expect(chamadasLotes[0].rows.length).toBe(250);
    expect(chamadasLotes[1].rows.length).toBe(50);
    expect(chamadasLotes[0].loteIndex).toBe(1);
    expect(chamadasLotes[1].loteIndex).toBe(2);

    expect(progressos.length).toBe(2);
    expect(progressos[0].porcentagem).toBe(50);
    expect(progressos[1].porcentagem).toBe(100);
  });

  it("deve pausar graciosamente quando um lote falhar sem lançar exceção não tratada", async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([
      ["A"],
      ["Data de Referência", "Paciente", "CPF", "Procedimento", "Usuário da conta", "Unidade", "Tipo Procedimento", "Total Pago"],
      ["2026-07-01", "P1", "12345678901", "C", "U", "M", "R", 100],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const file = new File([buffer], "teste_falha.xlsx");

    let falhaCapturada: FalhaLoteInfo | null = null;

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/chunked/iniciar")) {
        return {
          ok: true,
          text: async () => JSON.stringify({ uploadId: "upload-uuid-999" }),
        };
      }
      if (url.includes("/chunked/lote")) {
        return {
          ok: false,
          status: 500,
          text: async () => JSON.stringify({ error: "Falha de conexão com o banco" }),
        };
      }
      return { ok: true, text: async () => "{}" };
    });

    global.fetch = mockFetch as any;

    const resultado = await executarUploadChunked({
      file,
      mesReferencia: "2026-07",
      onFalhaLote: (f) => {
        falhaCapturada = f;
      },
    });

    expect(resultado.concluido).toBe(false);
    if (!resultado.concluido) {
      expect(resultado.pausado).toBe(true);
      expect(resultado.falha.loteFalhoIndex).toBe(0);
      expect(resultado.falha.uploadId).toBe("upload-uuid-999");
    }
    expect(falhaCapturada).not.toBeNull();
    expect(falhaCapturada?.loteFalhoIndex).toBe(0);
  });
});

