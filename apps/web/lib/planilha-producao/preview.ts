import type {
  Contadores,
  LinhaBase,
  PreviewRow,
  ResultadoLinha,
} from "./types";

export function atualizarContadores(
  resultado: ResultadoLinha,
  contadores: Contadores,
): void {
  const { status, dadosParceiro } = resultado;

  if (status === "VALIDO") {
    if (dadosParceiro.resgatadoPorConsultorPf) {
      contadores.totalResgatados++;
    } else {
      contadores.totalValidos++;
    }
  } else if (status === "ORFAO") {
    contadores.totalOrfaos++;
  } else if (status === "DUPLICADA") {
    // Duplicadas são contabilizadas separadamente de rejeitadas (no bloco de duplicidade).
  } else {
    contadores.totalRejeitados++;
  }
}

export function montarPreviewRow(
  rowNumber: number,
  linha: LinhaBase,
  resultado: ResultadoLinha,
  comercialPorId: Map<string, string>,
  valorComissao = 0,
): PreviewRow {
  const { status, motivo, alerta, dadosParceiro } = resultado;
  const parceiroEncontrado = dadosParceiro.parceiroEncontrado;

  return {
    rowNumber,
    dataReferencia: linha.dataReferencia ?? String(linha.dataReferenciaRaw),
    paciente: linha.paciente,
    cpf: linha.cpf,
    procedimento: linha.procedimento,
    tipoProcedimento: linha.tipoProcedimento,
    unidade: linha.unidade || "NÃO INFORMADA",
    usuarioDaConta: linha.usuarioDaConta,
    status,
    motivo,
    alerta,
    parceiroNome: parceiroEncontrado?.nome,
    comercialNome: parceiroEncontrado
      ? comercialPorId.get(parceiroEncontrado.comercialId ?? "")
      : undefined,
    gestorNome: dadosParceiro.gestorEncontrado?.nome,
    consultorPfNome: dadosParceiro.consultorPf?.nome,
    resgatadoPorConsultorPf: dadosParceiro.resgatadoPorConsultorPf,
    valorComissao,
    valorTotal: linha.valorTotal ?? undefined,
  };
}