import { describe, expect, it, vi } from "vitest";
import {
  generateResetToken,
  getTokenExpirationTime,
  hashToken,
  isTokenExpired,
  validatePasswordStrength,
} from "@/lib/password-reset";

describe("password-reset — regras funcionais", () => {
  it("gera token hexadecimal seguro com 64 caracteres", () => {
    const token = generateResetToken();

    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produz hash SHA-256 determinístico e diferente do token", () => {
    const token = "token-de-teste";

    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
    expect(hashToken(token)).not.toBe(hashToken("outro-token"));
  });

  it("aceita senha que atende a todos os requisitos", () => {
    expect(validatePasswordStrength("SenhaForte1!")).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("retorna todas as violações da senha", () => {
    expect(validatePasswordStrength("abc")).toEqual({
      valid: false,
      errors: [
        "Mínimo 8 caracteres",
        "Pelo menos 1 letra maiúscula",
        "Pelo menos 1 número",
        "Pelo menos 1 caractere especial (!@#$%^&*...)",
      ],
    });
  });

  it("distingue token expirado de token ainda válido", () => {
    vi.setSystemTime(new Date("2026-08-22T12:00:00.000Z"));

    expect(isTokenExpired(new Date("2026-08-21T12:00:00.000Z"))).toBe(true);
    expect(isTokenExpired(new Date("2026-08-23T12:00:00.000Z"))).toBe(false);

    vi.useRealTimers();
  });

  it("calcula expiração 24 horas à frente", () => {
    vi.setSystemTime(new Date("2026-08-22T12:00:00.000Z"));

    expect(getTokenExpirationTime()).toEqual(new Date("2026-08-23T12:00:00.000Z"));

    vi.useRealTimers();
  });
});
