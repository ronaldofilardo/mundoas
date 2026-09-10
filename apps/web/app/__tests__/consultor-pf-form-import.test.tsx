import { describe, it, expect } from "vitest";

describe("ConsultorPfForm - Import Only", () => {
  it("deve importar o componente", async () => {
    const mod = await import("@/app/(dashboard)/backoffice/comissionamento/equipe/components/consultor-pf-form");
    expect(mod).toBeDefined();
  });
});