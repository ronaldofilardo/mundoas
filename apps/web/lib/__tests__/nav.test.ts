import { describe, it, expect } from "vitest";
import { resolveNavProfile, isLinkActive } from "@/lib/nav";

describe("resolveNavProfile", () => {
  it("rota /backoffice/* sempre resolve para perfil backoffice, mesmo com sessão divergente", () => {
    const p = resolveNavProfile(
      { tipo: "COMERCIAL", name: "X" },
      "/backoffice/usuarios/comerciais",
    );
    expect(p.id).toBe("backoffice");
  });

  it("GESTOR + papel BACKOFFICE → perfil backoffice (sem rota)", () => {
    const p = resolveNavProfile({ tipo: "GESTOR", papel: "BACKOFFICE", name: "X" });
    expect(p.id).toBe("backoffice");
  });

  it("BACKOFFICE → perfil backoffice (sem rota)", () => {
    const p = resolveNavProfile({ tipo: "BACKOFFICE", name: "X" });
    expect(p.id).toBe("backoffice");
    expect(p.groups.find((g) => g.title === "Comissionamento")?.links.length).toBeGreaterThan(0);
  });

  it("rota tem prioridade sobre sessão (sessão qualquer em /backoffice/* → backoffice)", () => {
    const p = resolveNavProfile(
      { tipo: "COMERCIAL", name: "X" },
      "/backoffice/dashboard",
    );
    expect(p.id).toBe("backoffice");
  });

  it("COMERCIAL → perfil comercial (sem rota)", () => {
    const p = resolveNavProfile({ tipo: "COMERCIAL", name: "X" });
    expect(p.id).toBe("comercial");
  });

  it("tipo desconhecido sem rota cai no DEFAULT_PROFILE_ID (backoffice)", () => {
    const p = resolveNavProfile({ tipo: "NAO_EXISTE", name: "X" });
    expect(p.id).toBe("backoffice");
  });

  it("sessão nula sem rota cai no DEFAULT_PROFILE_ID (backoffice)", () => {
    const p = resolveNavProfile(null);
    expect(p.id).toBe("backoffice");
  });
});

describe("isLinkActive", () => {
  it("match exato", () => {
    expect(isLinkActive("/backoffice/producao/relatorios", "/backoffice/producao/relatorios")).toBe(true);
  });

  it("match por prefixo (sub-rota)", () => {
    expect(isLinkActive("/backoffice/producao/relatorios/abc", "/backoffice/producao/relatorios")).toBe(true);
  });

  it("não confunde prefixos de mesmo radical", () => {
    expect(isLinkActive("/backoffice/comissionamento-outro", "/backoffice/comissionamento")).toBe(false);
  });

  it("exact=true exige igualdade", () => {
    expect(isLinkActive("/backoffice/comissionamento/relatorios/abc", "/backoffice/comissionamento", true)).toBe(false);
  });

  it("ignora query string para o match (pathname nunca traz query)", () => {
    expect(isLinkActive("/backoffice/producao", "/backoffice/producao?tab=upload")).toBe(true);
  });
});

describe("manifesto — Metas & Produção", () => {
  it("perfil backoffice expõe link 'Metas & Produção' apontando para ?tab=comerciais", async () => {
    const { NAV_PROFILES } = await import("@/lib/nav/manifest");
    const comissionamento = NAV_PROFILES.backoffice.groups.find(
      (g) => g.title === "Comissionamento",
    );
    expect(comissionamento).toBeDefined();
    const link = comissionamento!.links.find((l) => l.label === "Metas & Produção");
    expect(link).toBeDefined();
    expect(link?.href).toBe("/backoffice/comissionamento?tab=comerciais");
    expect(link?.icon).toBe("goals");
  });

  it("perfil liderança rotula como 'Metas & Produção'", async () => {
    const { NAV_PROFILES } = await import("@/lib/nav/manifest");
    const links = NAV_PROFILES.lideranca.groups.flatMap((g) => g.links);
    const link = links.find((l) => l.href === "/lideranca/metas");
    expect(link).toBeDefined();
    expect(link?.label).toBe("Metas & Produção");
    expect(link?.icon).toBe("goals");
  });
});

