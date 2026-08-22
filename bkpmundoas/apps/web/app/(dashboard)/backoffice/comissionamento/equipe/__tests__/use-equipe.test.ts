import { describe, it, expect } from "vitest";
import { buildEquipeItens } from "../hooks/use-equipe";

describe("buildEquipeItens", () => {
  it("lista comercial real + liderança GESTOR sem duplicar liderança COMERCIAL", () => {
    const comerciais = [
      { id: "com1", nome: "Real", cpf: "111", email: "c@x", status: "ATIVO", funcao: "GERENTE_CIRE", tipoLideranca: null, isLideranca: false },
      { id: "lid-com", nome: "LidCom", cpf: "222", email: "lc@x", status: "ATIVO", funcao: "LIDER_COMERCIAL", tipoLideranca: "COMERCIAL", isLideranca: true },
    ];
    const liderancas = [
      { id: "lid-com", nome: "LidCom", cpf: "222", email: "lc@x", status: "ATIVO", tipo: "COMERCIAL" },
      { id: "lid-gestor", nome: "LidGes", cpf: "333", email: "lg@x", status: "ATIVO", tipo: "GESTOR" },
    ];

    const itens = buildEquipeItens(comerciais, liderancas, new Map());

    const ids = itens.map((i) => i.id);
    expect(ids).toContain("com1");
    expect(ids).toContain("lid-com");
    expect(ids).toContain("lid-gestor");
  });

  it("liderança COMERCIAL aparece exatamente uma vez como kind=lideranca", () => {
    const comerciais = [
      { id: "lid-com", nome: "LidCom", cpf: "222", email: "lc@x", status: "ATIVO", funcao: "LIDER_COMERCIAL", tipoLideranca: "COMERCIAL", isLideranca: true },
    ];
    const liderancas = [
      { id: "lid-com", nome: "LidCom", cpf: "222", email: "lc@x", status: "ATIVO", tipo: "COMERCIAL" },
    ];

    const itens = buildEquipeItens(comerciais, liderancas, new Map());

    const lidCom = itens.filter((i) => i.id === "lid-com");
    expect(lidCom).toHaveLength(1);
    expect(lidCom[0].kind).toBe("lideranca");
  });

  it("comercial real aparece como kind=comercial", () => {
    const comerciais = [
      { id: "com1", nome: "Real", cpf: "111", email: "c@x", status: "ATIVO", funcao: "GERENTE_CIRE", tipoLideranca: null, isLideranca: false },
    ];

    const itens = buildEquipeItens(comerciais, [], new Map());

    const com = itens.find((i) => i.id === "com1");
    expect(com?.kind).toBe("comercial");
  });

  it("liderança GESTOR aparece como kind=lideranca", () => {
    const liderancas = [
      { id: "lid-gestor", nome: "LidGes", cpf: "333", email: "lg@x", status: "ATIVO", tipo: "GESTOR" },
    ];

    const itens = buildEquipeItens([], liderancas, new Map());

    const ges = itens.find((i) => i.id === "lid-gestor");
    expect(ges?.kind).toBe("lideranca");
  });

  it("liderança COMERCIAL não é duplicada mesmo se vier como comercial E como liderança", () => {
    const comerciais = [
      { id: "lid-com", nome: "LidCom", cpf: "222", email: "lc@x", status: "ATIVO", funcao: "LIDER_COMERCIAL", tipoLideranca: "COMERCIAL", isLideranca: true },
      { id: "com1", nome: "Real", cpf: "111", email: "c@x", status: "ATIVO", funcao: "GERENTE_CIRE", tipoLideranca: null, isLideranca: false },
    ];
    const liderancas = [
      { id: "lid-com", nome: "LidCom", cpf: "222", email: "lc@x", status: "ATIVO", tipo: "COMERCIAL" },
    ];

    const itens = buildEquipeItens(comerciais, liderancas, new Map());

    expect(itens).toHaveLength(2);
    expect(itens.map((i) => i.id).sort()).toEqual(["com1", "lid-com"]);
  });

  it("lista vazia quando não há dados", () => {
    const itens = buildEquipeItens([], [], new Map());
    expect(itens).toEqual([]);
  });

  it("apenas lideranças COMERCIAL como comerciais, GESTOR como lideranças", () => {
    const comerciais = [
      { id: "lid-com", nome: "LidCom", cpf: "222", email: "lc@x", status: "ATIVO", funcao: "LIDER_COMERCIAL", tipoLideranca: "COMERCIAL", isLideranca: true },
    ];
    const liderancas = [
      { id: "lid-com", nome: "LidCom", cpf: "222", email: "lc@x", status: "ATIVO", tipo: "COMERCIAL" },
      { id: "lid-gestor", nome: "LidGes", cpf: "333", email: "lg@x", status: "ATIVO", tipo: "GESTOR" },
    ];

    const itens = buildEquipeItens(comerciais, liderancas, new Map());

    const comercialItens = itens.filter((i) => i.kind === "comercial");
    const liderancaItens = itens.filter((i) => i.kind === "lideranca");

    expect(comercialItens).toHaveLength(0);
    expect(liderancaItens.map((i) => i.id).sort()).toEqual(["lid-com", "lid-gestor"]);
  });

  it("inclui consultores PF por liderança", () => {
    const liderancas = [
      { id: "lid-gestor", nome: "LidGes", cpf: "333", email: "lg@x", status: "ATIVO", tipo: "GESTOR" },
    ];
    const consultorPfs = new Map<string, any[]>([
      ["lid-gestor", [
        { id: "cp1", nome: "Consultor 1", cpf: "999", email: "cp1@x", status: "ATIVO" },
      ]],
    ]);

    const itens = buildEquipeItens([], liderancas, consultorPfs);

    const ges = itens.find((i) => i.id === "lid-gestor");
    expect(ges?.consultorPfs).toHaveLength(1);
    expect(ges?.consultorPfs?.[0].nome).toBe("Consultor 1");
  });
});
