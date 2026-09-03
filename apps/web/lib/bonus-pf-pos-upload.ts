import { prisma } from "@asa/database";
import { obterCicloBonusConsultorPf, creditarBonusConsultorPfPorProducao } from "./pontos-utils";

export interface BonusPfPosUploadResult {
  bonusPfDistribuidos: number;
  bonusPfIgnorados: number;
  bonusPfIgnoradosExistente: number;
  bonusPfErros: number;
}

export async function processarBonusPfPosUpload(
  uploadId: string,
  backofficeId: string,
): Promise<BonusPfPosUploadResult> {
  const resultado: BonusPfPosUploadResult = {
    bonusPfDistribuidos: 0,
    bonusPfIgnorados: 0,
    bonusPfIgnoradosExistente: 0,
    bonusPfErros: 0,
  };

  const ciclo = await obterCicloBonusConsultorPf(backofficeId);
  if (!ciclo) {
    console.warn("[bonus-pf-pos-upload] Nenhum ciclo CONSULTOR_PF vigente encontrado; bônus PF não será distribuído automaticamente.");
    return resultado;
  }

  const procedimentos = await prisma.procedimentoPF.findMany({
    where: {
      uploadId,
      consultorPfId: { not: null },
      modalidadeContemplacao: "COMISSAO",
    },
    select: {
      id: true,
      consultorPfId: true,
      valorTotal: true,
      dataReferencia: true,
      procedimento: true,
    },
  });

  if (procedimentos.length === 0) {
    return resultado;
  }

  for (const procedimento of procedimentos) {
    if (
      procedimento.dataReferencia < ciclo.inicioAcumuloEm ||
      procedimento.dataReferencia > ciclo.fimAcumuloEm
    ) {
      resultado.bonusPfIgnorados += 1;
      continue;
    }

    try {
      if (procedimento.valorTotal === null) {
        resultado.bonusPfIgnorados += 1;
        continue;
      }

      const credito = await creditarBonusConsultorPfPorProducao({
        procedimentoId: procedimento.id,
        consultorPfId: procedimento.consultorPfId!,
        backofficeId,
        cicloPontosId: ciclo.id,
        valorTotal: procedimento.valorTotal,
        dataReferencia: procedimento.dataReferencia,
      });

      if (credito.criado) {
        resultado.bonusPfDistribuidos += 1;
      } else {
        resultado.bonusPfIgnoradosExistente += 1;
      }

      await prisma.procedimentoPF.update({
        where: { id: procedimento.id },
        data: { modalidadeContemplacao: "BONUS_PONTOS" },
      });
    } catch (err) {
      resultado.bonusPfErros += 1;
      console.error(`[bonus-pf-pos-upload] Erro ao processar bônus para procedimento ${procedimento.id}:`, err);
    }
  }

  return resultado;
}
