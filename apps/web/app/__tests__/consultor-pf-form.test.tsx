import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConsultorPfForm } from "@/app/(dashboard)/backoffice/comissionamento/equipe/components/consultor-pf-form";

describe("ConsultorPfForm - Importação", () => {
  it("deve ser importável", () => {
    expect(ConsultorPfForm).toBeDefined();
  });
});

describe("ConsultorPfForm - Estado Inicial", () => {
  it("deve inicializar com estado padrão", async () => {
    render(<ConsultorPfForm />);
    const nome = await screen.findByLabelText("Nome completo");
    expect(nome.prop("value")).toBe("");
    const email = await screen.findByLabelText("Email");
    expect(email.prop("value")).toBe("");
    const cpf = await screen.findByLabelText("CPF");
    expect(cpf.prop("value")).toBe("");
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
      <ConsultorPfForm consultor={mockConsultor} />
    );
    const nome = await screen.findByLabelText("Nome completo");
    expect(nome.prop("value")).toBe("João Silva");
    const email = await screen.findByLabelText("Email");
    expect(email.prop("value")).toBe("joao@exemplo.com");
    const cpf = await screen.findByLabelText("CPF");
    expect(cpf.prop("value")).toBe("123.456.789-01");
  });
});

describe("ConsultorPpForm - CPF Formatando", () => {
  it("deve formatar CPF simples", async () => {
    render(<ConsultorPfForm />);
    const cpfInput = await screen.findByLabelText("CPF");
    cpfInput.simulate("change", { target: { value: "12345678901" } });
    expect(cpfInput.prop("value")).toBe("123.456.789-01");
  });
});

describe("ConsultorPfForm - Validação", () => {
  it("deve validar campos obrigatórios", async () => {
    render(<ConsultorPfForm />);
    const form = await screen.findByRole("form");
    expect(form.prop("checkValidity")).toBeFalsy();
  });
});

describe("ConsultorPfForm - Setores", () => {
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
      <ConsultorPfForm consultor={mockConsultor} />
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
      setores: [
        { id: "3", nome: "Matriz" },
        { id: "4", nome: "Filial" },
      ],
    };
    render(
      <ConsultorPfForm consultor={mockConsultor} />
    );
    const checkboxes = await screen.findAllByRole("checkbox");
    checkboxes[0].simulate("change");
    expect(checkboxes[0].prop("checked")).toBe(true);
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
    setores: [
      { id: "3", nome: "Matriz" },
      { id: "4", nome: "Filial" },
    ],
  };

  it("deve lidar com consultor nulo", async () => {
    render(
      <ConsultorPfForm consultor={null} />
    );
    const nome = await screen.findByLabelText("Nome completo");
    expect(nome.prop("value")).toBe("");
  });

  it("deve ter email disabled", async () => {
    render(
      <ConsultorPfForm consultor={mockConsultor} />
    );
    const emailInput = await screen.findByLabelText("Email");
    expect(emailInput.prop("disabled")).toBe(true);
  });

  it("deve mostrar mensagem de email imutável", async () => {
    render(
      <ConsultorPfForm consultor={mockConsultor} />
    );
    const text = await screen.findByText("O email não pode ser alterado após a criação.");
    expect(text.textContent).toContain("O email não pode ser alterado após a criação.");
  });

  it("deve mostrar mensagem de CPF imutável", async () => {
    render(
      <ConsultorPfForm consultor={mockConsultor} />
    );
    const text = await screen.findByText("O CPF não pode ser alterado após a criação.");
    expect(text.textContent).toContain("O CPF não pode ser alterado após a criação.");
  });

  it("deve mostrar mensagem de liderança imutável", async () => {
    render(
      <ConsultorPfForm consultor={mockConsultor} />
    );
    const text = await screen.findByText("A liderança não pode ser alterada após a criação.");
    expect(text.textContent).toContain("A liderança não pode ser alterada após a criação.");
  });
});