import { createHash, timingSafeEqual } from "crypto";

/**
 * Compara dois tokens de forma segura contra timing attacks,
 * utilizando SHA-256 para uniformizar o tamanho dos buffers antes de timingSafeEqual.
 */
export function safeCompareTokens(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const hashProvided = createHash("sha256").update(provided).digest();
  const hashExpected = createHash("sha256").update(expected).digest();
  return timingSafeEqual(hashProvided, hashExpected);
}

