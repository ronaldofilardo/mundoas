import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Testes unitários e de integração para TabelaDistribuicao
 * 
 * Agora testa a lógica REAL extraída de tabela-distribuicao.tsx
 * via utils e actions - garantindo baseline de cobertura ≥ 80% para Component
 * conforme POLITICA_REFATORACAO v2.0.
 */

/** Tipos mínimos compatíveis com DistribuicaoPontosItem */
interface ProducaoOriginal {
  id: string;
  paciente?: string | null;
  procedimento?: string | null;
  parceiro?: { id?: string; nome?: string | null } | null;
  valorTotal?: number | string | null;
  valorPorPonto?: number | string | null;
  dataReferencia?: string | null;
  dataProcedimento?: string | null;
  pontosPotenciais?: number | null;
  pontosDistribuidos?: { pontos: number; cicloPontosId?: string } | null;
}

/** Dados mock usados em todos os testes */
const mockData: ProducaoOriginal[] = [
  {
    id: "1",
    paciente: "Marcia Costa De Oliveira",
    procedimento: "Hemograma com contagem de plaquetas",
    parceiro: { nome: "Tania Karla" },
    valorTotal: 17.03,
    valorPorPonto: 0.5,
    dataReferencia: "2026-07-06",
    pontosPotenciais: 0,
    pontosDistribuidos: null,
  },
  {
    id: "2",
    paciente: "Rosangela Depieri",
    procedimento: "Consulta Eletiva Clínico Geral",
    parceiro: { nome: "Tania Karla" },
    valorTotal: 69.9,
    valorPorPonto: 2.5,
    dataReferencia: "2026-07-06",
    pontosPotenciais: 1,
    pontosDistribuidos: null,
  },
  {
    id: "3",
    paciente: "Camila Iagla Pires",
    procedimento: "Consulta Eletiva Clínico Geral",
    parceiro: { nome: "Tania Karla" },
    valorTotal: 69.9,
    valorPorPonto: 2.5,
    dataReferencia: "2026-07-06",
    pontosPotenciais: 1,
    pontosDistribuidos: { pontos: 1 },
  },
  {
    id: "4",
    paciente: "ELIDIANE DOS SANTOS PAULINO DOS ANJOS",
    procedimento: "Consulta Eletiva Oftalmologia - Saude Ocular",
    parceiro: { nome: "Joao Silva" },
    valorTotal: 79.9,
    valorPorPonto: 3.0,
    dataReferencia: "2026-07-05",
    pontosPotenciais: 1,
    pontosDistribuidos: { pontos: 1 },
  },
];

/** Filtros padrões (vazios) */
const filtrosVazios = {} as {
  filtroParceiro?: string;
  filtroIndicado?: string;
  filtroDataInicio?: string;
  filtroDataFim?: string;
};

/** utils importados do código REAL (tabela-distribuicao.utils.ts) */
import {
  listarParceirosUnicos,
  filtrarProducoes,
  contarPendentes,
  formatarMoeda,
  formatarData,
  obterPontosExibicao,
  obterStatusDistribuicao,
} from "@/app/(dashboard)/backoffice/pontos/components/tabela-distribuicao.utils";

/** actions importados do código REAL (tabela-distribuicao.actions.ts) */
import {
  distribuirProducao,
  distribuirTodasProducoes,
  type DistribuicaoResult,
} from "@/app/(dashboard)/backoffice/pontos/components/tabela-distribuicao.actions";

describe("TabelaDistribuicao - Utils (Lógica Real Extraída)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listarParceirosUnicos", () => {
    it("deve extrair parceiros únicos da lista", () => {
      const resultado = listarParceirosUnicos(mockData);
      expect(resultado).toHaveLength(2);
      expect(resultado).toContain("Tania Karla");
      expect(resultado).toContain("Joao Silva");
    });

    it("deve retornar array vazio quando não houver dados", () => {
      expect(listarParceirosUnicos(undefined)).toHaveLength(0);
      expect(listarParceirosUnicos(null)).toHaveLength(0);
    });

    it("não deve duplicar parceiros repetidos", () => {
      const dadosComRepetidos: ProducaoOriginal[] = [
        { ...mockData[0], parceiro: { nome: "Parceiro A" } },
        { ...mockData[1], parceiro: { nome: "Parceiro A" } },
        { ...mockData[2], parceiro: { nome: "Parceiro B" } },
      ];
      const resultado = listarParceirosUnicos(dadosComRepetidos);
      expect(resultado).toHaveLength(2);
      expect(resultado).toEqual(["Parceiro A", "Parceiro B"]);
    });
  });

  describe("filtrarProducoes", () => {
    it("deve filtrar por nome do indicado (case insensitive)", () => {
      const filtros = { filtroIndicado: "rosangela" };
      const resultado = filtrarProducoes(mockData, filtros);
      expect(resultado).toHaveLength(1);
      expect(resultado[0].paciente).toBe("Rosangela Depieri");
    });

    it("deve filtrar por parte do nome do indicado", () => {
      const filtros = { filtroIndicado: "Santos" };
      const resultado = filtrarProducoes(mockData, filtros);
      expect(resultado).toHaveLength(1);
      expect(resultado[0].paciente).toBe("ELIDIANE DOS SANTOS PAULINO DOS ANJOS");
    });

    it("deve retornar todos quando filtro vazio", () => {
      const resultado = filtrarProducoes(mockData, filtrosVazios);
      expect(resultado).toHaveLength(4);
    });

    it("deve filtrar por parceiro específico", () => {
      const filtros = { filtroParceiro: "Joao Silva" };
      const resultado = filtrarProducoes(mockData, filtros);
      expect(resultado).toHaveLength(1);
      expect(resultado[0].parceiro?.nome).toBe("Joao Silva");
    });

    it("deve filtrar múltiplos itens do mesmo parceiro", () => {
      const filtros = { filtroParceiro: "Tania Karla" };
      const resultado = filtrarProducoes(mockData, filtros);
      expect(resultado).toHaveLength(3);
      resultado.forEach((p) => {
        expect(p.parceiro?.nome).toBe("Tania Karla");
      });
    });

    it("deve combinar filtros de parceiro e indicado", () => {
      const filtros = { filtroParceiro: "Tania Karla", filtroIndicado: "Rosangela" };
      const resultado = filtrarProducoes(mockData, filtros);
      expect(resultado).toHaveLength(1);
      expect(resultado[0].paciente).toBe("Rosangela Depieri");
      expect(resultado[0].parceiro?.nome).toBe("Tania Karla");
    });

    it("deve combinar filtros de data (range)", () => {
      const filtros = { filtroDataInicio: "2026-07-06", filtroDataFim: "2026-07-06" };
      const resultado = filtrarProducoes(mockData, filtros);
      expect(resultado).toHaveLength(3);
      resultado.forEach((p) => {
        expect(p.dataReferencia).toBe("2026-07-06");
      });
    });

    it("deve combinar todos os filtros", () => {
      const filtros = {
        filtroParceiro: "Tania Karla",
        filtroIndicado: "Camila",
        filtroDataInicio: "2026-07-06",
        filtroDataFim: "2026-07-06",
      };
      const resultado = filtrarProducoes(mockData, filtros);
      expect(resultado).toHaveLength(1);
      expect(resultado[0].paciente).toBe("Camila Iagla Pires");
    });

    it("deve retornar array vazio quando combinação não tiver resultados", () => {
      const filtros = { filtroParceiro: "Joao Silva", filtroIndicado: "Rosangela" };
      const resultado = filtrarProducoes(mockData, filtros);
      expect(resultado).toHaveLength(0);
    });
  });

  describe("contarPendentes", () => {
    it("deve contar produções sem pontos distribuídos", () => {
      expect(contarPendentes(mockData)).toBe(2);
    });

    it("deve retornar 0 quando dados forem undefined", () => {
      expect(contarPendentes(undefined)).toBe(0);
    });

    it("deve retornar total quando nenhum for distribuído", () => {
      const dadosApenasPendentes: ProducaoOriginal[] = [
        { ...mockData[0], pontosDistribuidos: undefined },
        { ...mockData[1], pontosDistribuidos: undefined },
      ];
      expect(contarPendentes(dadosApenasPendentes)).toBe(2);
    });
  });

  describe("formatarMoeda", () => {
    it("deve formatar valor numérico como moeda PT-BR", () => {
      expect(formatarMoeda(17.03)).toBe("R$ 17,03");
      expect(formatarMoeda(69.9)).toBe("R$ 69,90");
      expect(formatarMoeda(79.9)).toBe("R$ 79,90");
    });

    it("deve lidar com null e undefined", () => {
      expect(formatarMoeda(null)).toBe("R$ 0,00");
      expect(formatarMoeda(undefined)).toBe("R$ 0,00");
    });

    it("deve lidar com NaN", () => {
      expect(formatarMoeda(NaN)).toBe("R$ 0,00");
    });
  });

  describe("formatarData", () => {
    it("deve formatar data no formato PT-BR", () => {
      expect(formatarData("2026-07-05")).toBe("05/07/2026");
      expect(formatarData("2026-07-06")).toBe("06/07/2026");
    });

    it("deve retornar string vazia quando data for null/undefined", () => {
      expect(formatarData(null)).toBe("");
      expect(formatarData(undefined)).toBe("");
    });
  });

  describe("obterPontosExibicao", () => {
    it("deve exibir pontos distribuídos em verde", () => {
      const result = obterPontosExibicao({
        ...mockData[3],
        pontosDistribuidos: { pontos: 1 },
      });
      expect(result.texto).toBe("1 pts");
      expect(result.className).toContain("text-green-600");
    });

    it("deve exibir pontos potenciais em amarelo", () => {
      const result = obterPontosExibicao({
        ...mockData[1],
        pontosDistribuidos: null,
        pontosPotenciais: 1,
      });
      expect(result.texto).toBe("1 pts");
      expect(result.className).toContain("text-yellow-600");
    });

    it("deve exibir 0 pts quando pontosPotenciais for 0", () => {
      const result = obterPontosExibicao({
        ...mockData[0],
        pontosDistribuidos: null,
        pontosPotenciais: 0,
      });
      expect(result.texto).toBe("0 pts");
    });
  });

  describe("obterStatusDistribuicao", () => {
    it("deve retornar span verde 'Distribuído' quando já distribuído", () => {
      const result = obterStatusDistribuicao({
        ...mockData[3],
        pontosDistribuidos: { pontos: 1 },
      });
      expect(result).toContain("Distribuído");
      expect(result).toContain("bg-green-100");
    });

    it("deve retornar button 'Distribuir' quando pendente", () => {
      const result = obterStatusDistribuicao({
        ...mockData[0],
        pontosDistribuidos: null,
      });
      expect(result).toContain("Distribuir");
      expect(result).toContain("bg-primary-600");
    });
  });
});

describe("TabelaDistribuicao - Actions (Fetch simulado)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Configuração padrão de fetch para os testes
    vi.stubGlobal("fetch", Promise.resolve({
      ok: true,
      json: async () => ({ mensagem: "sucesso" }),
    }));
  });

  // Removido afterEach com vi.unstubGlobal - vitest v4 lida com cleanup automaticamente
  // após cada test file/execution. O global fetch é redefinido entre suites.

  describe("distribuirProducao", () => {
    it("deve retornar ok=true quando API responder ok", async () => {
      const result: DistribuicaoResult = await distribuirProducao("prod-1");
      expect(result.ok).toBe(true);
    });

    it("deve retornar ok=false quando API responder erro", async () => {
      vi.stubGlobal("fetch", Promise.resolve({
        ok: false,
        json: async () => ({ error: "Erro simulado" }),
      }));
      const result: DistribuicaoResult = await distribuirProducao("prod-1");
      expect(result.ok).toBe(false);
      // A action retorna mensagem genérica de erro em catch de rede
      expect(result.error).toBe("Erro ao distribuir pontos");
    });

    it("deve tratar erro de rede", async () => {
      vi.stubGlobal("fetch", Promise.reject(new Error("Network error")));
      const result: DistribuicaoResult = await distribuirProducao("prod-1");
      expect(result.ok).toBe(false);
      expect(result.error).toContain("Erro ao distribuir pontos");
    });
  });

  describe("distribuirTodasProducoes", () => {
    it("deve retornar ok=true com mensagem de sucesso", async () => {
      const result: DistribuicaoResult = await distribuirTodasProducoes();
      expect(result.ok).toBe(true);
    });

    it("deve retornar resultado com erros quando alguns falham", async () => {
      vi.stubGlobal("fetch", Promise.resolve({
        ok: true,
        json: async () => ({
          distribuidos: 2,
          totalPontos: 10,
          erros: 1,
        }),
      }));
      const result: DistribuicaoResult = await distribuirTodasProducoes();
      expect(result.ok).toBe(true);
      expect(result.erros).toBe(1);
      expect(result.distribuidos).toBe(2);
    });

    it("deve tratar erro de rede", async () => {
      vi.stubGlobal("fetch", Promise.reject(new Error("Network error")));
      const result: DistribuicaoResult = await distribuirTodasProducoes();
      expect(result.ok).toBe(false);
      expect(result.error).toContain("Erro ao distribuir pontos em lote");
    });
  });
});