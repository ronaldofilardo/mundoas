import crypto from "crypto";

function getSecretKey(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "mundoas-auth-reset-secret-salt"
  );
}

export interface PasswordResetPayload {
  userId: string;
  email: string;
  pwh: string;
  exp: number;
}

/**
 * Cria um token assinado com HMAC-SHA256 contendo expiração e hash da senha atual.
 * Se a senha for trocada, o hash muda e o token fica imediatamente inválido.
 */
export function createPasswordResetToken(params: {
  userId: string;
  email: string;
  senhaHash: string;
  expiresInHours?: number;
}): string {
  const secret = getSecretKey();
  const exp = Date.now() + (params.expiresInHours ?? 48) * 60 * 60 * 1000;
  const pwh = crypto
    .createHash("sha256")
    .update(params.senhaHash)
    .digest("hex")
    .slice(0, 16);

  const payload: PasswordResetPayload = {
    userId: params.userId,
    email: params.email,
    pwh,
    exp,
  };

  const jsonStr = JSON.stringify(payload);
  const dataB64 = Buffer.from(jsonStr).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(dataB64)
    .digest("base64url");

  return `${dataB64}.${signature}`;
}

/**
 * Valida a integridade da assinatura e a data de expiração do token.
 */
export function verifyPasswordResetToken(
  token: string,
): PasswordResetPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [dataB64, signature] = parts;
    const secret = getSecretKey();

    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(dataB64)
      .digest("base64url");

    if (
      signature.length !== expectedSig.length ||
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSig),
      )
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(dataB64, "base64url").toString("utf8"),
    ) as PasswordResetPayload;

    if (!payload.userId || !payload.exp || typeof payload.exp !== "number") {
      return null;
    }

    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Confirma se o token ainda é válido para o hash de senha atual do usuário.
 */
export function isPasswordHashMatching(
  currentSenhaHash: string,
  pwh: string,
): boolean {
  const computedPwh = crypto
    .createHash("sha256")
    .update(currentSenhaHash)
    .digest("hex")
    .slice(0, 16);
  return computedPwh === pwh;
}
