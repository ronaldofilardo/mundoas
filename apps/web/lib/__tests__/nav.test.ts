import { describe, it, expect } from "vitest";
import { resolveNavProfile, isLinkActive } from "@/lib/nav";

describe("resolveNavProfile", () => {
  it("rota /backoffice/* sempre resolve para perfil backoffice, mesmo com sessão divergente", () => {
    const p = resolveNavProfile(
      { tipo: "CONSULTOR", name: "X" },
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

  it("rota tem prioridade sobre sessão (sessão Consultor em /gestor/* → gestor)", () => {
    const p = resolveNavProfile(
      { tipo: "CONSULTOR", name: "X" },
      "/gestor/dashboard",
    );
    expect(p.id).toBe("gestor");
  });

  it("CONSULTOR → perfil consultor (sem rota)", () => {
    const p = resolveNavProfile({ tipo: "CONSULTOR_PF", name: "X" });
    expect(p.id).toBe("consultor");
  });

  it("tipo desconhecido sem rota cai no DEFAULT_PROFILE_ID (consultor)", () => {
    const p = resolveNavProfile({ tipo: "NAO_EXISTE", name: "X" });
    expect(p.id).toBe("consultor");
  });

  it("sessão nula sem rota cai no DEFAULT_PROFILE_ID", () => {
    const p = resolveNavProfile(null);
    expect(p.id).toBe("consultor");
  });
});

describe("isLinkActive", () => {
  it("match exato", () => {
    expect(isLinkActive("/backoffice/comissionamento/relatorios", "/backoffice/comissionamento/relatorios")).toBe(true);
  });

  it("match por prefixo (sub-rota)", () => {
    expect(isLinkActive("/backoffice/comissionamento/relatorios/abc", "/backoffice/comissionamento/relatorios")).toBe(true);
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
