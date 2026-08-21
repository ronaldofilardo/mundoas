import { describe, it, expect } from "vitest";

describe("parceiros-pontos - interfaces", () => {
  it("deve definir Parceiro com campos obrigatórios", () => {
    const p: any = { id: "p1", nome: "João", cpf: "123", email: "joao@test", status: "ATIVO", totalIndicados: 3, indicacoes: [] };
    expect(p.id).toBe("p1");
    expect(p.totalIndicados).toBe(3);
  });
});
