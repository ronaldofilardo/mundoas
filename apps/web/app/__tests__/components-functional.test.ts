import { describe, expect, it } from "vitest";

// Componentes e hooks pendentes — testes básicos de importação

describe("Lote 3 — Componentes e hooks (worktree)", () => {
  it("tab-regras — módulo importado", async () => {
    const m = await import("@/app/(dashboard)/backoffice/comissionamento/components/tab-regras");
    expect(typeof m).toBe("object");
  });

  it("consultor-pf-form — módulo importado", async () => {
    const m = await import("@/app/(dashboard)/backoffice/comissionamento/equipe/components/consultor-pf-form");
    expect(typeof m).toBe("object");
  });

  it("use-equipe — módulo importado", async () => {
    const m = await import("@/app/(dashboard)/backoffice/comissionamento/equipe/hooks/use-equipe");
    expect(typeof m).toBe("object");
  });

  it("dialog — módulo importado", async () => {
    const m = await import("@/components/ui/dialog");
    expect(typeof m).toBe("object");
  });

  it("table — módulo importado", async () => {
    const m = await import("@/components/ui/table");
    expect(typeof m).toBe("object");
  });
});
