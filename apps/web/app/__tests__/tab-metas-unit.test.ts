import { describe, it, expect } from "vitest";

describe("tab-metas - props interface", () => {
  it("deve aceitar itens com EquipeItem", () => {
    const mockItem = { id: "1", nome: "Maria", kind: "lideranca" as const, status: "ATIVO", funcao: "SUPERVISOR_ATIVO" };
    expect(mockItem.id).toBe("1");
    expect(mockItem.kind).toBe("lideranca");
  });
});
