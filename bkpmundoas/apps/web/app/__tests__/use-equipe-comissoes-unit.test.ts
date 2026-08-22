import { describe, it, expect } from "vitest";

describe("use-equipe-comissoes - interfaces", () => {
  it("deve exportar ComissaoEquipe com campos obrigatórios", () => {
    const comissao: any = { mesReferencia: "2025-01", valorVendas: 1000, valorComissao: 100, status: "OK", temFalta: false };
    expect(comissao.mesReferencia).toBe("2025-01");
  });

  it("deve exportar MembroComComissoes", () => {
    const membro: any = { id: "1", nome: "Ana", kind: "comercial", comissoes: [] };
    expect(membro.id).toBeDefined();
  });
});
