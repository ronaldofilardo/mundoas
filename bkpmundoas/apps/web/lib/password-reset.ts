import crypto from "crypto";

/**
 * Generate a secure random token.
 * (ainda usado por comercial/parceiros e gestor/parceiros para gerar o
 * token da primeiraAcss — mecanismo legado a ser removido em fase futura)
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a token using SHA256
 * (usado para armazenar o token de primeiraAcss hasheado no banco)
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Validate password strength
 * Requirements: min 8 chars, 1 uppercase, 1 number, 1 special char
 * @param allowCpfAsTemp - if true, allows 11-digit numeric CPF as valid (for partner first access)
 */
export function validatePasswordStrength(password: string, allowCpfAsTemp = false): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Allow CPF (11 digits only) as temporary password for partners
  if (allowCpfAsTemp && /^\d{11}$/.test(password)) {
    return { valid: true, errors: [] };
  }

  if (password.length < 8) {
    errors.push("Mínimo 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Pelo menos 1 letra maiúscula");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Pelo menos 1 número");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Pelo menos 1 caractere especial (!@#$%^&*...)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
