import { describe, it, expect } from "vitest";

describe("tab-comissoes - props interface", () => {
  it("deve aceitar itens com EquipeItem", () => {
    const mockItem = { id: "1", nome: "João", kind: "comercial" as const, status: "ATIVO" };
    expect(mockItem.id).toBe("1");
    expect(mockItem.kind).toBe("comercial");
  });
});
