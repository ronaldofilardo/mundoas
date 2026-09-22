/**
 * Calcula o próximo vencimento (formato YYYY-MM-DD) para um dia do mês especificado,
 * baseado explicitamente no fuso horário brasileiro (America/Sao_Paulo), evitando
 * discrepâncias de horário do servidor.
 */
export function proximoVencimento(dia: number, dataReferencia: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const partes = formatter.formatToParts(dataReferencia);
  const anoAtual = Number(partes.find((p) => p.type === "year")?.value);
  const mesAtual = Number(partes.find((p) => p.type === "month")?.value);
  const diaAtual = Number(partes.find((p) => p.type === "day")?.value);

  let ano = anoAtual;
  let mes = mesAtual;

  if (diaAtual >= dia) {
    mes += 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
  }

  const mesStr = String(mes).padStart(2, "0");
  const diaStr = String(dia).padStart(2, "0");
  return `${ano}-${mesStr}-${diaStr}`;
}
