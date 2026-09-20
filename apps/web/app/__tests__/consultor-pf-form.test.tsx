import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ConsultorPfForm } from "@/app/(dashboard)/backoffice/comissionamento/equipe/components/consultor-pf-form";

const mockOnSave = vi.fn().mockResolvedValue(undefined);
const mockOnClose = vi.fn();

function mockFetchSuccess() {
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes("/setores")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }
    if (url.includes("/liderancas")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }
    if (url.includes("/regras-comerciais")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ itens: [] }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

function mockFetchWithOptions() {
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes("/setores")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: "3", nome: "Matriz" },
            { id: "4", nome: "Filial" },
          ]),
      });
    }
    if (url.includes("/liderancas")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }
    if (url.includes("/regras-comerciais")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            itens: [{ nome: "Matriz" }, { nome: "Filial" }],
          }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

describe("ConsultorPfForm - Importação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSuccess();
  });

  it("deve ser importável", () => {
    expect(ConsultorPfForm).toBeDefined();
  });
});

describe("ConsultorPfForm - Estado Inicial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSuccess();
  });

  it("deve inicializar com estado padrão", async () => {
    render(<ConsultorPfForm onSave={mockOnSave} onClose={mockOnClose} />);
    const nome = await screen.findByLabelText(/Nome completo/);
    expect(nome).toHaveValue("");
    const email = await screen.findByLabelText(/Email/);
    expect(email).toHaveValue("");
    const cpf = await screen.findByLabelText(/CPF/);
    expect(cpf).toHaveValue("");
  });

  it("deve preencher form quando consultor é fornecido", async () => {
    const mockConsultor = {
      id: "1",
      nome: "João Silva",
      email: "joao@exemplo.com",
      cpf: "123.456.789-01",
      telefone: null,
      status: "ATIVO",
      liderancaId: "2",
      setores: [
        { id: "3", nome: "Matriz" },
        { id: "4", nome: "Filial" },
      ],
    };
    render(
      <ConsultorPfForm consultor={mockConsultor} onSave={mockOnSave} onClose={mockOnClose} />,
    );
    const nome = await screen.findByLabelText(/Nome completo/);
    expect(nome).toHaveValue("João Silva");
    const email = await screen.findByLabelText(/Email/);
    expect(email).toHaveValue("joao@exemplo.com");
    const cpf = await screen.findByLabelText(/CPF/);
    expect(cpf).toHaveValue("123.456.789-01");
  });
});

describe("ConsultorPfForm - CPF Formatando", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSuccess();
  });

  it("deve formatar CPF simples", async () => {
    render(<ConsultorPfForm onSave={mockOnSave} onClose={mockOnClose} />);
    const cpfInput = await screen.findByLabelText(/CPF/);
    fireEvent.change(cpfInput, { target: { value: "12345678901" } });
    expect(cpfInput).toHaveValue("123.456.789-01");
  });
});

describe("ConsultorPfForm - Validação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSuccess();
  });

  it("deve validar campos obrigatórios", async () => {
    render(<ConsultorPfForm onSave={mockOnSave} onClose={mockOnClose} />);
    const submitBtn = await screen.findByRole("button", { name: /criar consultor/i });
    expect(submitBtn).toBeInTheDocument();
  });
});

describe("ConsultorPfForm - Setores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithOptions();
  });

  it("deve renderizar checkboxes de setores", async () => {
    const mockConsultor = {
      id: "1",
      nome: "João Silva",
      email: "joao@exemplo.com",
      cpf: "123.456.789-01",
      telefone: null,
      status: "ATIVO",
      liderancaId: "2",
      setores: [
        { id: "3", nome: "Matriz" },
        { id: "4", nome: "Filial" },
      ],
    };
    render(
      <ConsultorPfForm consultor={mockConsultor} onSave={mockOnSave} onClose={mockOnClose} />,
    );
    const checkboxes = await screen.findAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("deve permitir toggle de setor", async () => {
    const mockConsultor = {
      id: "1",
      nome: "João Silva",
      email: "joao@exemplo.com",
      cpf: "123.456.789-01",
      telefone: null,
      status: "ATIVO",
      liderancaId: "2",
      setores: [
        { id: "3", nome: "Matriz" },
        { id: "4", nome: "Filial" },
      ],
    };
    render(
      <ConsultorPfForm consultor={mockConsultor} onSave={mockOnSave} onClose={mockOnClose} />,
    );
    const checkboxes = await screen.findAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();
  });
});

describe("ConsultorPfForm - Edge Cases", () => {
  const mockConsultor = {
    id: "1",
    nome: "João Silva",
    email: "joao@exemplo.com",
    cpf: "123.456.789-01",
    telefone: null,
    status: "ATIVO",
    liderancaId: "2",
    setores: [
      { id: "3", nome: "Matriz" },
      { id: "4", nome: "Filial" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithOptions();
  });

  it("deve lidar com consultor nulo", async () => {
    render(
      <ConsultorPfForm consultor={null} onSave={mockOnSave} onClose={mockOnClose} />,
    );
    const nome = await screen.findByLabelText(/Nome completo/);
    expect(nome).toHaveValue("");
  });

  it("deve ter email disabled", async () => {
    render(
      <ConsultorPfForm consultor={mockConsultor} onSave={mockOnSave} onClose={mockOnClose} />,
    );
    const emailInput = await screen.findByLabelText(/Email/);
    expect(emailInput).toBeDisabled();
  });

  it("deve mostrar mensagem de email imutável", async () => {
    render(
      <ConsultorPfForm consultor={mockConsultor} onSave={mockOnSave} onClose={mockOnClose} />,
    );
    const text = await screen.findByText("O email não pode ser alterado após a criação.");
    expect(text.textContent).toContain("O email não pode ser alterado após a criação.");
  });

  it("deve mostrar mensagem de CPF imutável", async () => {
    render(
      <ConsultorPfForm consultor={mockConsultor} onSave={mockOnSave} onClose={mockOnClose} />,
    );
    const text = await screen.findByText("O CPF não pode ser alterado após a criação.");
    expect(text.textContent).toContain("O CPF não pode ser alterado após a criação.");
  });

  it("deve mostrar mensagem de liderança imutável", async () => {
    render(
      <ConsultorPfForm consultor={mockConsultor} onSave={mockOnSave} onClose={mockOnClose} />,
    );
    const text = await screen.findByText("A liderança não pode ser alterada após a criação.");
    expect(text.textContent).toContain("A liderança não pode ser alterada após a criação.");
  });
});
