export function validarMesReferencia(value: unknown): value is string {
  return typeof value === "string" && /^(\d{4})-(0[1-9]|1[0-2])$/.test(value);
}

export function intervaloMesReferencia(mesReferencia: string) {
  const [ano, mes] = mesReferencia.split("-").map(Number);
  return {
    inicio: new Date(Date.UTC(ano, mes - 1, 1)),
    fim: new Date(Date.UTC(ano, mes, 1)),
  };
}
