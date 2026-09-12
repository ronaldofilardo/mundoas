import { describe, it, expect } from "vitest";
import {
  createPasswordResetToken,
  verifyPasswordResetToken,
  isPasswordHashMatching,
} from "../password-reset-token";

describe("password-reset-token", () => {
  const sampleUser = {
    userId: "user-123",
    email: "gestor@acessosaude.com.br",
    senhaHash: "$2a$12$abcdef1234567890abcdef1234567890",
  };

  it("deve criar um token e verificá-lo com sucesso", () => {
    const token = createPasswordResetToken(sampleUser);
    expect(typeof token).toBe("string");
    expect(token.includes(".")).toBe(true);

    const payload = verifyPasswordResetToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(sampleUser.userId);
    expect(payload?.email).toBe(sampleUser.email);
    expect(payload?.pwh).toBeDefined();
    expect(payload?.exp).toBeGreaterThan(Date.now());
  });

  it("deve rejeitar token adulterado", () => {
    const token = createPasswordResetToken(sampleUser);
    const tampered = token + "tampered";
    expect(verifyPasswordResetToken(tampered)).toBeNull();
  });

  it("deve validar e invalidar hash de senha", () => {
    const token = createPasswordResetToken(sampleUser);
    const payload = verifyPasswordResetToken(token)!;

    expect(
      isPasswordHashMatching(sampleUser.senhaHash, payload.pwh),
    ).toBe(true);

    // Senha trocada -> hash diferente
    const newSenhaHash = "$2a$12$novasenhaHash999999999999999999";
    expect(isPasswordHashMatching(newSenhaHash, payload.pwh)).toBe(false);
  });

  it("deve rejeitar token expirado", () => {
    const token = createPasswordResetToken({
      ...sampleUser,
      expiresInHours: -1, // expirado no passado
    });

    expect(verifyPasswordResetToken(token)).toBeNull();
  });
});
