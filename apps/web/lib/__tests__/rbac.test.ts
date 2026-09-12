import { describe, expect, it } from "vitest";
import {
  isAdminRole,
  isBackofficeRole,
  isGestorPjRole,
  isLiderancaRole,
  isConsultorRole,
  isParceiroRole,
  isComercialRole,
  getCanonicalRole,
  hasAnyRole,
  dashboardForUser,
} from "@/lib/rbac";

describe("RBAC Centralizado — Testes Unitários de Papéis e Permissões", () => {
  describe("isAdminRole", () => {
    it("identifica ADMIN corretamente", () => {
      expect(isAdminRole({ tipo: "ADMIN" })).toBe(true);
      expect(isAdminRole({ tipo: "BACKOFFICE" })).toBe(false);
      expect(isAdminRole(null)).toBe(false);
    });
  });

  describe("isBackofficeRole", () => {
    it("identifica BACKOFFICE nativo e GESTOR com papel BACKOFFICE", () => {
      expect(isBackofficeRole({ tipo: "BACKOFFICE" })).toBe(true);
      expect(isBackofficeRole({ tipo: "BACKOFFICE", papel: "BACKOFFICE" })).toBe(true);
      expect(isBackofficeRole({ tipo: "GESTOR", papel: "BACKOFFICE" })).toBe(true);
      expect(isBackofficeRole({ tipo: "GESTOR", papel: "GESTOR_PJ" })).toBe(false);
      expect(isBackofficeRole({ tipo: "ADMIN" })).toBe(false);
      expect(isBackofficeRole(null)).toBe(false);
    });
  });

  describe("isGestorPjRole", () => {
    it("identifica GESTOR com papel GESTOR_PJ", () => {
      expect(isGestorPjRole({ tipo: "GESTOR", papel: "GESTOR_PJ" })).toBe(true);
      expect(isGestorPjRole({ tipo: "GESTOR", papel: "BACKOFFICE" })).toBe(false);
      expect(isGestorPjRole({ tipo: "BACKOFFICE" })).toBe(false);
    });
  });

  describe("isLiderancaRole", () => {
    it("identifica LIDERANCA", () => {
      expect(isLiderancaRole({ tipo: "LIDERANCA" })).toBe(true);
      expect(isLiderancaRole({ tipo: "ADMIN" })).toBe(false);
    });
  });

  describe("isConsultorRole", () => {
    it("identifica CONSULTOR e CONSULTOR_PF", () => {
      expect(isConsultorRole({ tipo: "CONSULTOR" })).toBe(true);
      expect(isConsultorRole({ tipo: "CONSULTOR_PF" })).toBe(true);
      expect(isConsultorRole({ tipo: "PARCEIRO" })).toBe(false);
    });
  });

  describe("getCanonicalRole & hasAnyRole", () => {
    it("retorna o papel canônico correto", () => {
      expect(getCanonicalRole({ tipo: "ADMIN" })).toBe("ADMIN");
      expect(getCanonicalRole({ tipo: "GESTOR", papel: "BACKOFFICE" })).toBe("BACKOFFICE");
      expect(getCanonicalRole({ tipo: "BACKOFFICE" })).toBe("BACKOFFICE");
      expect(getCanonicalRole({ tipo: "GESTOR", papel: "GESTOR_PJ" })).toBe("GESTOR_PJ");
      expect(getCanonicalRole({ tipo: "LIDERANCA" })).toBe("LIDERANCA");
      expect(getCanonicalRole({ tipo: "CONSULTOR_PF" })).toBe("CONSULTOR_PF");
      expect(getCanonicalRole({ tipo: "PARCEIRO" })).toBe("PARCEIRO");
      expect(getCanonicalRole({ tipo: "COMERCIAL" })).toBe("COMERCIAL");
      expect(getCanonicalRole(null)).toBe("DESCONHECIDO");
    });

    it("hasAnyRole valida permissões flexíveis", () => {
      const boUser = { tipo: "GESTOR", papel: "BACKOFFICE" };
      expect(hasAnyRole(boUser, ["BACKOFFICE", "ADMIN"])).toBe(true);
      expect(hasAnyRole(boUser, ["GESTOR_PJ", "PARCEIRO"])).toBe(false);
    });
  });

  describe("dashboardForUser", () => {
    it("redireciona para o dashboard correto por papel", () => {
      expect(dashboardForUser({ tipo: "ADMIN" })).toBe("/admin/usuarios");
      expect(dashboardForUser({ tipo: "BACKOFFICE" })).toBe("/backoffice/dashboard");
      expect(dashboardForUser({ tipo: "GESTOR", papel: "BACKOFFICE" })).toBe("/backoffice/dashboard");
      expect(dashboardForUser({ tipo: "GESTOR", papel: "GESTOR_PJ" })).toBe("/gestor/dashboard");
      expect(dashboardForUser({ tipo: "PARCEIRO" })).toBe("/parceiro/indicados");
      expect(dashboardForUser({ tipo: "COMERCIAL" })).toBe("/comercial/minha-comissao");
      expect(dashboardForUser({ tipo: "CONSULTOR_PF" })).toBe("/consultor/comissoes");
      expect(dashboardForUser({ tipo: "LIDERANCA" })).toBe("/lideranca");
      expect(dashboardForUser(null)).toBe("/login");
    });
  });
});
