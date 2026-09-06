import { Prisma } from "@asa/database";
import { validarCPF } from "@/lib/pontos-utils";

import { dataParaChave, PlanilhaCell } from "./helpers";
import { PlanilhaParsada } from "./planilha-parser";
import { extrairLinha, IndicesColunas } from "./planilha-validator";
import {
  resolverMatching,
  MapsEquipe,
  ParceiroResumo,
} from "./parceiro-matcher";

interface Contadores {
  totalRows: number;
  processedRows: number;
  duplicatedRows: number;
  rejectedRows: number;
  orphanedRows: number;
}

function linhaVazia(row: PlanilhaCell[]): boolean {
  return !row || Object.keys(row).length === 0;
}

export interface ContextoProcessamento {
  uploadId: string;
  idxs: IndicesColunas;
  planilha: PlanilhaParsada;
  maps: MapsEquipe;
  parceiros: ParceiroResumo[];
  chavesExistentes: Set<string>;
}

export interface ResultadoLinhas {
  contadores: Contadores;
  procedimentosToCreate: Prisma.ProcedimentoPFCreateManyInput[];
  linhasRawToCreate: Prisma.ProcedimentoPFRawCreateManyInput[];
}

export function processarLinhas(ctx: ContextoProcessamento): ResultadoLinhas {
  const contadores: Contadores = {
    totalRows: 0,
    processedRows: 0,
    duplicatedRows: 0,
    rejectedRows: 0,
    orphanedRows: 0,
  };
  const procedimentosToCreate: Prisma.ProcedimentoPFCreateManyInput[] = [];
  const linhasRawToCreate: Prisma.ProcedimentoPFRawCreateManyInput[] = [];

  for (let i = 2; i < ctx.planilha.linhas.length; i++) {
    const row = ctx.planilha.linhas[i];
    if (linhaVazia(row)) continue;

    contadores.totalRows++;

    const linha = extrairLinha(row, ctx.idxs, i + 1);

    if (linha.rejeitado) {
      contadores.rejectedRows++;
      linhasRawToCreate.push({
        uploadId: ctx.uploadId,
        linhaOriginal: i + 1,
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
      ctx.parceiros,
      ctx.maps,
    );

    linhasRawToCreate.push({
      uploadId: ctx.uploadId,
      linhaOriginal: i + 1,
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
    if (ctx.chavesExistentes.has(chaveProcedimento)) {
      contadores.duplicatedRows++;
      continue;
    }
    ctx.chavesExistentes.add(chaveProcedimento);

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
      uploadId: ctx.uploadId,
      valorComissao: 0,
      valorTotal: linha.valorTotal,
      comercialId: matching.comercialId ?? matching.parceiroEncontrado?.comercialId ?? null,
      gestorId: matching.gestorIdFromNome ?? matching.parceiroEncontrado?.gestorId ?? null,
      consultorPfId: matching.consultorPfId,
    });

    contadores.processedRows++;
  }

  return { contadores, procedimentosToCreate, linhasRawToCreate };
}