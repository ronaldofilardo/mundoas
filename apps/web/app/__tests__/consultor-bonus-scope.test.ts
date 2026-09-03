import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({
  default: () => ({}),
  handlers: {},
  auth: async () => null,
  signIn: async () => ({}),
  signOut: async () => ({}),
  __esModule: true,
}));

const mocks = vi.hoisted(() => ({
  consultorPf: {
    findFirst: vi.fn(),
  },
}));

vi.mock("@asa/database", () => ({
  prisma: {
    consultorPf: mocks.consultorPf,
  },
}));

vi.mock("@/lib/api-helpers", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-helpers")>("@/lib/api-helpers");
  return {
    ...actual,
    requireConsultorPfWithScope: vi.fn(),
  };
});

import { requireConsultorPfWithScope } from "@/lib/api-helpers";

const consultorPfId = "cpf-1";
const backofficeId = "bo-1";

describe("requireConsultorPfWithScope", () => {
  it("aceita usuario do tipo CONSULTOR_PF", async () => {
    (requireConsultorPfWithScope as ReturnType<typeof vi.fn>).mockResolvedValue({
      consultorPfId,
      backofficeId,
      error: null,
    });

    const result = await requireConsultorPfWithScope();
    expect(result.error).toBeNull();
    expect(result.consultorPfId).toBe(consultorPfId);
    expect(result.backofficeId).toBe(backofficeId);
  });
});
