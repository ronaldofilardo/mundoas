/**
 * Testes de regressão para TabComissoes (baseline PRÉ-refatoração).
 * Documenta o comportamento atual do componente para garantir zero regressão.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, cleanup, fireEvent } from "@testing-library/react";
import { TabComissoes } from "@/app/(dashboard)/backoffice/comissionamento/equipe/components/tab-comissoes";
import type { EquipeItem } from "@/app/(dashboard)/backoffice/comissionamento/equipe/types";
import type {
  MembroComComissoes,
  ValidacaoItem,
} from "@/app/(dashboard)/backoffice/comissionamento/equipe/hooks/use-equipe-comissoes";

const atualizarFaltaMock = vi.fn();
const fetchValidacaoMock = vi.fn();

let hookState: {
  membrosComComissoes: MembroComComissoes[];
  loading: boolean;
  validacao: ValidacaoItem[];
  validacaoLoading: boolean;
};

vi.mock("@/app/(dashboard)/backoffice/comissionamento/equipe/hooks/use-equipe-comissoes", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/app/(dashboard)/backoffice/comissionamento/equipe/hooks/use-equipe-comissoes")>();
  return {
    ...original,
    useEquipeComissoes: () => ({
      membrosComComissoes: hookState.membrosComComissoes,
      loading: hookState.loading,
      validacao: hookState.validacao,
      validacaoLoading: hookState.validacaoLoading,
      atualizarFalta: atualizarFaltaMock,
      fetchValidacao: fetchValidacaoMock,
      refetch: vi.fn(),
    }),
  };
});

const ANO_ATUAL = new Date().getFullYear();

const itens: EquipeItem[] = [
  { id: "lid-1", nome: "Ana Lider", cpf: "111", email: "ana@x.com", status: "ATIVO", kind: "lideranca", funcao: null },
  { id: "com-1", nome: "Beto Comercial", cpf: "222", email: "beto@x.com", status: "INATIVO", kind: "comercial", funcao: "GERENTE_CIRE" },
];

const membros: MembroComComissoes[] = [
  {
    id: "lid-1",
    nome: "Ana Lider",
    kind: "lideranca",
    funcao: null,
    comissoes: [{ mesReferencia: "2025-03", valorVendas: 0, valorComissao: 0, status: "PENDENTE", temFalta: false }],
  },
  {
    id: "com-1",
    nome: "Beto Comercial",
    kind: "comercial",
    funcao: "GERENTE_CIRE",
    comissoes: [],
  },
];

const validacaoItem: ValidacaoItem = {
  empresaSetor: "Ana Lider / SP",
  tipo: "LIDERANCA",
  liderancaId: "lid-1",
  liderancaNome: "Ana Lider",
  meta: 100000,
  producao: 120000,
  comissaoCalculada: 5000,
  metaBatida: true,
  comissaoLideranca: 3000,
  subordinados: [
    { id: "com-1", nome: "Beto Comercial", funcao: "GERENTE_CIRE", percentualComissao: 2.5, meta: 50000, producao: 40000, comissao: 800, metaBatida: false },
  ],
  consultoresPf: [
    { id: "cpf-1", nome: "Carla PF", meta: 10000, producao: 12000, metaBatida: true },
  ],
};

function setup(overrides?: Partial<typeof hookState>) {
  hookState = {
    membrosComComissoes: membros,
    loading: false,
    validacao: [],
    validacaoLoading: false,
    ...overrides,
  };
}

function renderTab(onMesChange = vi.fn()) {
  return {
    onMesChange,
    ...render(<TabComissoes itens={itens} mesReferencia="2025-03" onMesChange={onMesChange} />),
  };
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TabComissoes - baseline", () => {
  it("mostra mensagem quando não há membros na equipe", () => {
    setup();
    render(<TabComissoes itens={[]} mesReferencia="2025-03" onMesChange={vi.fn()} />);
    expect(screen.getByText("Nenhum membro da equipe cadastrado.")).toBeInTheDocument();
  });

  it("exibe grade de faltas com membros ATIVOS por padrão (inativos ocultos)", () => {
    setup();
    renderTab();
    expect(screen.getByText(/Grade de Faltas/)).toBeInTheDocument();
    expect(screen.getByText("Ana Lider (Liderança)")).toBeInTheDocument();
    expect(screen.queryByText("Beto Comercial")).not.toBeInTheDocument();
  });

  it("mostra inativos com opacidade ao marcar o checkbox", () => {
    setup();
    renderTab();
    fireEvent.click(screen.getByLabelText("Mostrar inativos"));
    const inativo = screen.getByText("Beto Comercial");
    expect(inativo).toBeInTheDocument();
    expect(inativo.closest("tr")?.className).toContain("opacity-50");
  });

  it("formatar função substituindo underscores por espaços", () => {
    setup();
    renderTab();
    fireEvent.click(screen.getByLabelText("Mostrar inativos"));
    expect(screen.getByText("GERENTE CIRE")).toBeInTheDocument();
  });

  it("ao marcar checkbox da grade chama atualizarFalta com (id, mesRef, true) usando ano corrente", () => {
    setup();
    renderTab();
    fireEvent.click(screen.getByLabelText("Falta de Ana Lider (Liderança) em Mar"));
    expect(atualizarFaltaMock).toHaveBeenCalledWith("lid-1", `${ANO_ATUAL}-03`, true);
  });

  it("botão Validar Resultados alterna para view de validação e busca dados do mês selecionado", () => {
    setup({ validacao: [validacaoItem] });
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Validar Resultados" }));
    expect(fetchValidacaoMock).toHaveBeenCalledWith("2025-03");
    expect(screen.getByText("Validação de Resultados - Mar/2025")).toBeInTheDocument();
  });

  it("validação: exibe empty state quando não há dados", () => {
    setup({ validacao: [] });
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Validar Resultados" }));
    expect(screen.getByText(/Nenhum dado de validação encontrado para Mar\/2025/)).toBeInTheDocument();
  });

  it("validação: renderiza card com meta, produção, badges e subordinados", () => {
    setup({ validacao: [validacaoItem] });
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Validar Resultados" }));

    expect(screen.getByText("Ana Lider / SP")).toBeInTheDocument();
    expect(screen.getByText("✓ Sim")).toBeInTheDocument();
    expect(screen.getByText("Comerciais (1)")).toBeInTheDocument();
    expect(screen.getByText("Consultores PF (1)")).toBeInTheDocument();
    expect(screen.getByText("Carla PF")).toBeInTheDocument();
  });

  it("validação: trocar mês dispara onMesChange e fetchValidacao com novo mês", () => {
    setup({ validacao: [validacaoItem] });
    const { onMesChange } = renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Validar Resultados" }));

    fireEvent.change(screen.getByLabelText("Mês:"), { target: { value: "02" } });
    expect(onMesChange).toHaveBeenCalledWith("2025-02");
    expect(fetchValidacaoMock).toHaveBeenCalledWith("2025-02");
  });

  it("validação: checkbox de falta do item principal usa liderancaId", () => {
    setup({ validacao: [validacaoItem] });
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Validar Resultados" }));

    fireEvent.click(screen.getByLabelText("Falta de Ana Lider"));
    expect(atualizarFaltaMock).toHaveBeenCalledWith("lid-1", "2025-03", true);
  });

  it("validação: checkbox de falta de subordinado usa id do subordinado", () => {
    setup({ validacao: [validacaoItem] });
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Validar Resultados" }));

    fireEvent.click(screen.getByLabelText("Falta de Beto Comercial"));
    expect(atualizarFaltaMock).toHaveBeenCalledWith("com-1", "2025-03", true);
  });

  it("voltar para grade de faltas restaura a view padrão", () => {
    setup({ validacao: [validacaoItem] });
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Validar Resultados" }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar para Grade de Faltas" }));
    expect(screen.getByText(/Grade de Faltas/)).toBeInTheDocument();
  });

  it("sincroniza mês selecionado quando prop mesReferencia muda", () => {
    setup({ validacao: [validacaoItem] });
    const { rerender, onMesChange } = renderTab();
    rerender(<TabComissoes itens={itens} mesReferencia="2025-07" onMesChange={onMesChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Validar Resultados" }));
    expect(fetchValidacaoMock).toHaveBeenCalledWith("2025-07");
  });

  it("exibe estado de loading na grade", () => {
    setup({ loading: true });
    renderTab();
    expect(screen.getByText("Carregando comissões...")).toBeInTheDocument();
  });
});
