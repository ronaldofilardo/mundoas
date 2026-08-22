import { describe, it, expect } from "vitest";

describe("tab-regras - componente", () => {
  it("deve exportar TabRegras", async () => {
    const mod = await import("../../app/(dashboard)/backoffice/comissionamento/components/tab-regras");
    expect(mod).toHaveProperty("TabRegras");
  });
});
