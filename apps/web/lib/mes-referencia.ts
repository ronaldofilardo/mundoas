const MES_REFERENCIA_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function ehMesReferenciaValido(valor: string): boolean {
  return MES_REFERENCIA_PATTERN.test(valor.trim());
}

export function normalizarMesReferencia(valor: string): string | null {
  const normalizado = valor.trim();
  return ehMesReferenciaValido(normalizado) ? normalizado : null;
}
