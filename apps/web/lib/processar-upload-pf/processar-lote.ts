import { prisma } from "@/lib/db";
import { Prisma } from "@asa/database";
import { validarCPF } from "@/lib/pontos-utils";

import { dataParaChave, normalizarCpf, PlanilhaCell } from "./helpers";
import { NOMES_COLUNA_VALOR_TOTAL } from "./planilha-parser";
import { extrairLinha, IndicesColunas } from "./planilha-validator";
import {
  carregarMapsEquipe,
  carregarParceiros,
  resolverMatching,
} from "./parceiro-matcher";

export interface LoteContadores {
  totalRows: number;
  processedRows: number;
  duplicatedRows: number;
  rejectedRows: number;
  orphanedRows: number;
}

export interface ProcessarLoteInput {
  uploadId: string;
  backofficeId: string;
  headersRaw: unknown[];
  rows: PlanilhaCell[][];
  startRowNumber: number;
}

const normalizar = (s: string) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function montarIndicesDeHeaders(headersRaw: unknown[]): IndicesColunas {
  const headers = headersRaw.reduce<Record<string, string>>(
    (acc, h, idx) => {
      const headerStr = h ? String(h).trim() : "";
      if (headerStr) {
        acc[String(idx)] = headerStr;
      }
      return acc;
    },
    {},
  );

  const getColIndex = (nome: string) => {
    const n = normalizar(nome);
    return Object.values(headers).findIndex((h) => normalizar(h) === n);
  };

  const getColIndexFlexible = (nomes: string[]) => {
    for (const nome of nomes) {
      const idx = getColIndex(nome);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const idxValorTotal = getColIndexFlexible(NOMES_COLUNA_VALOR_TOTAL);
  if (idxValorTotal < 0) {
    throw new Error(
      "Coluna financeira obrigatória faltando: Total Pago, Valor Total ou equivalente",
    );
  }

  return {
    idxDataRef: getColIndex("Data de Referência"),
    idxPaciente: getColIndex("Paciente"),
    idxCpf: getColIndex("CPF"),
    idxProcedimento: getColIndex("Procedimento"),
    idxUsuarioConta: getColIndex("Usuário da conta"),
    idxUnidade: getColIndex("Unidade"),
    idxTipoProcedimento: getColIndex("Tipo Procedimento"),
    idxFormaPagamento: getColIndex("Forma Pagamento"),
    idxValorTotal,
  };
}

export async function obterChavesExistentes(
  backofficeId: string,
  mesReferencia: string | null,
): Promise<Set<string>> {
  const chaves = new Set<string>();
  if (!mesReferencia) return chaves;

  const [ano, mes] = mesReferencia.split("-");
  const inicioMes = new Date(Number(ano), Number(mes) - 1, 1);
  const fimMes = new Date(Number(ano), Number(mes), 0, 23, 59, 59);
  const existentes = await prisma.procedimentoPF.findMany({
    where: {
      upload: { backofficeId },
      dataReferencia: { gte: inicioMes, lte: fimMes },
    },
    select: { dataReferencia: true, cpf: true, procedimento: true, unidade: true },
  });
  for (const existente of existentes) {
    chaves.add(
      `${dataParaChave(existente.dataReferencia)}|${normalizarCpf(existente.cpf)}|${existente.procedimento}|${existente.unidade}`,
    );
  }
  return chaves;
}

export async function processarLoteUploadPF({
  uploadId,
  backofficeId,
  headersRaw,
  rows,
  startRowNumber,
}: ProcessarLoteInput): Promise<LoteContadores> {
  const upload = await prisma.uploadPlanilhaBackoffice.findFirst({
    where: { id: uploadId, backofficeId },
    select: { id: true, mesReferencia: true, status: true },
  });

  if (!upload) {
    throw new Error("Upload não encontrado ou acesso não autorizado");
  }

  const idxs = montarIndicesDeHeaders(headersRaw);
  const [maps, parceiros, chavesExistentes] = await Promise.all([
    carregarMapsEquipe(backofficeId),
    carregarParceiros(backofficeId),
    obterChavesExistentes(backofficeId, upload.mesReferencia),
  ]);

  const contadores: LoteContadores = {
    totalRows: 0,
    processedRows: 0,
    duplicatedRows: 0,
    rejectedRows: 0,
    orphanedRows: 0,
  };

  const procedimentosToCreate: Prisma.ProcedimentoPFCreateManyInput[] = [];
  const linhasRawToCreate: Prisma.ProcedimentoPFRawCreateManyInput[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || Object.keys(row).length === 0) continue;

    const rowNumber = startRowNumber + i;
    contadores.totalRows++;

    const linha = extrairLinha(row, idxs, rowNumber);

    if (linha.rejeitado) {
      contadores.rejectedRows++;
      linhasRawToCreate.push({
        uploadId,
        linhaOriginal: rowNumber,
        dadosOriginais: linha.dadosOriginais,
        valido: false,
        motivoRejeicao: linha.motivosRejeicao.join(","),
        orfao: false,
        motivoOrfao: null,
      });
      continue;
    }

    const cpfValido = validarCPF(linha.cpf);
    const matching = resolverMatching(
      linha.cpf,
      cpfValido,
      linha.usuarioDaConta,
      parceiros,
      maps,
    );

    linhasRawToCreate.push({
      uploadId,
      linhaOriginal: rowNumber,
      dadosOriginais: linha.dadosOriginais,
      valido: true,
      motivoRejeicao: null,
      orfao: matching.orfao,
      motivoOrfao: matching.orfao ? matching.motivosOrfao.join(",") : null,
    });

    if (matching.orfao || (!matching.parceiroEncontrado && !matching.consultorPfId)) {
      contadores.orphanedRows++;
      continue;
    }

    if (!linha.dataReferencia) {
      contadores.orphanedRows++;
      continue;
    }

    const chaveProcedimento = `${dataParaChave(linha.dataReferencia)}|${linha.cpf}|${linha.procedimento}|${linha.unidade}`;
    if (chavesExistentes.has(chaveProcedimento)) {
      contadores.duplicatedRows++;
      continue;
    }
    chavesExistentes.add(chaveProcedimento);

    procedimentosToCreate.push({
      dataReferencia: linha.dataReferencia,
      dataPagamento: new Date(),
      formaPagamento: linha.formaPagamento,
      paciente: linha.paciente,
      procedimento: linha.procedimento,
      cpf: linha.cpf,
      tipoProcedimento: linha.tipoProcedimento,
      unidade: linha.unidade,
      indicadoId: matching.indicadoId,
      parceiroId: matching.parceiroEncontrado?.id ?? null,
      uploadId,
      valorComissao: 0,
      valorTotal: linha.valorTotal,
      comercialId: matching.comercialId ?? matching.parceiroEncontrado?.comercialId ?? null,
      gestorId: matching.gestorIdFromNome ?? matching.parceiroEncontrado?.gestorId ?? null,
      consultorPfId: matching.consultorPfId,
    });

    contadores.processedRows++;
  }

  // Persistir em lotes seguros
  if (linhasRawToCreate.length > 0) {
    await prisma.procedimentoPFRaw.createMany({ data: linhasRawToCreate });
  }

  if (procedimentosToCreate.length > 0) {
    await prisma.procedimentoPF.createMany({
      data: procedimentosToCreate,
      skipDuplicates: true,
    });
  }

  // Atualizar contadores acumulados
  await prisma.uploadPlanilhaBackoffice.update({
    where: { id: uploadId },
    data: {
      processedRows: { increment: contadores.processedRows },
      duplicatedRows: { increment: contadores.duplicatedRows },
      rejectedRows: { increment: contadores.rejectedRows },
      orphanedRows: { increment: contadores.orphanedRows },
    },
  });

  return contadores;
}
