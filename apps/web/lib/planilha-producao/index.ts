import {
  COLUNAS_OBRIGATORIAS,
  COLUNAS_OPCIONAIS,
  extrairHeaders,
  lerPlanilha,
  mapearColunas,
  validarColunasObrigatorias,
} from "./parser";
import { carregarDados } from "./dados";
import { classificarLinha } from "./validacao";
import { extrairLinhaBase } from "./linha";
import { atualizarContadores, montarPreviewRow } from "./preview";
import type { Contadores, ParseResult, PreviewRow, ResultadoLinha } from "./types";

const MAX_PREVIEW_ROWS = 100;

export async function parsePlanilhaProducao(
  file: File,
  backofficeId: string,
): Promise<ParseResult> {
  const jsonData = await lerPlanilha(file);

  const headers = extrairHeaders(jsonData);
  validarColunasObrigatorias(headers);
  const mapaColunas = mapearColunas(headers);

  const { parceiros, consultorPorNome, comercialPorId, gestorPorNome, chavesExistentes } =
    await carregarDados(backofficeId);

  const previewRows: PreviewRow[] = [];
  const contadores: Contadores = {
    totalValidos: 0,
    totalResgatados: 0,
    totalOrfaos: 0,
    totalRejeitados: 0,
    totalDuplicadas: 0,
  };

  for (let i = 2; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || Object.keys(row).length === 0) continue;

    const rowNumber = i + 1;
    const linha = extrairLinhaBase(row, mapaColunas);

    const resultado = classificarLinha(
      linha,
      parceiros,
      consultorPorNome,
      gestorPorNome,
    );
    let { status, motivo } = resultado;
    const dadosParceiro = resultado.dadosParceiro;

    if (
      status === "VALIDO" &&
      linha.dataReferencia &&
      (dadosParceiro.parceiroEncontrado || dadosParceiro.resgatadoPorConsultorPf)
    ) {
      const chaveProcedimento = `${linha.dataReferencia}|${linha.cpf}|${linha.procedimento}|${linha.unidade || "NÃO INFORMADA"}`;
      if (chavesExistentes.has(chaveProcedimento)) {
        status = "DUPLICADA";
        motivo =
          "Produção já existe no banco e será ignorada para evitar duplicidade";
        contadores.totalDuplicadas++;
      } else {
        chavesExistentes.add(chaveProcedimento);
      }
    }

    const resultadoFinal: ResultadoLinha = {
      ...resultado,
      status,
      motivo,
    };

    atualizarContadores(resultadoFinal, contadores);

    if (previewRows.length < MAX_PREVIEW_ROWS) {
      previewRows.push(
        montarPreviewRow(rowNumber, linha, resultadoFinal, comercialPorId),
      );
    }
  }

  const totalLinhasDados = Math.max(0, jsonData.length - 2);

  return {
    fileName: file.name,
    previewRows,
    hasMore: totalLinhasDados > MAX_PREVIEW_ROWS,
    totalRows: totalLinhasDados,
    summary: {
      total: totalLinhasDados,
      validos: contadores.totalValidos,
      resgatados: contadores.totalResgatados,
      orfaos: contadores.totalOrfaos,
      rejeitados: contadores.totalRejeitados,
      duplicadas: contadores.totalDuplicadas,
      totalComissao: 0,
      colunasEncontradas: Object.values(headers).map((h) => String(h).trim()),
      colunasObrigatorias: COLUNAS_OBRIGATORIAS,
      colunasOpcionais: COLUNAS_OPCIONAIS,
    },
  };
}