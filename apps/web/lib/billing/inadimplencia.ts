import { prisma } from "@/lib/db";
import { calcularDiasAtraso, isFaturaBloqueavel } from "./fatura-status";

export {
  STATUS_FATURA_PAGA,
  calcularDiasAtraso,
  extrairDataBrasilia,
  isFaturaAtrasada15Dias,
  isFaturaBloqueavel,
  isFaturaPaga,
} from "./fatura-status";

/**
 * Verifica se o backoffice possui faturas com atraso que ultrapassam os 15 dias de tolerância.
 * Caso positivo, atualiza a assinatura para INADIMPLENTE e preenche os dados de bloqueio.
 */
export async function verificarInadimplenciaUnidade(backofficeId: string) {
  const assinatura = await prisma.assinatura.findUnique({
    where: { backofficeId },
    include: {
      faturas: {
        where: {
          pagoManualmente: false,
          statusPagamento: { notIn: ["CONFIRMED", "RECEIVED"] },
        },
        orderBy: { vencimento: "asc" },
      },
    },
  });

  if (!assinatura) return { bloqueado: false };

  // Cortesia válida não é bloqueada por inadimplência automática
  const cortesiaValida =
    assinatura.statusAssinatura === "CORTESIA" &&
    (!assinatura.cortesiaExpiraEm || new Date(assinatura.cortesiaExpiraEm) > new Date());
  if (cortesiaValida) return { bloqueado: false };

  const faturasBloqueaveis = assinatura.faturas.filter((f) => isFaturaBloqueavel(f));

  if (faturasBloqueaveis.length > 0) {
    const piorFatura = faturasBloqueaveis[0];
    const diasAtraso = calcularDiasAtraso(piorFatura.vencimento);

    if (assinatura.statusAssinatura !== "INADIMPLENTE") {
      await prisma.assinatura.update({
        where: { id: assinatura.id },
        data: {
          statusAssinatura: "INADIMPLENTE",
          bloqueadoEm: new Date(),
          motivoBloqueio: `Inadimplência: mensalidade vencida há ${diasAtraso} dias`,
        },
      });
    }

    return {
      bloqueado: true,
      motivo: "INADIMPLENCIA_ATRASO_15_DIAS",
      diasAtraso,
      fatura: piorFatura,
    };
  }

  return { bloqueado: false };
}

/**
 * Se a assinatura estiver INADIMPLENTE mas não houver mais faturas bloqueáveis
 * (ex: após baixa manual ou confirmação Asaas), restaura o status para ATIVA.
 */
export async function desbloquearUnidadeSeRegularizada(assinaturaId: string) {
  const assinatura = await prisma.assinatura.findUnique({
    where: { id: assinaturaId },
    include: {
      faturas: {
        where: {
          pagoManualmente: false,
          statusPagamento: { notIn: ["CONFIRMED", "RECEIVED"] },
        },
      },
    },
  });

  if (!assinatura) return null;

  const faturasAtrasadas = assinatura.faturas.filter((f) => isFaturaBloqueavel(f));

  if (faturasAtrasadas.length === 0 && assinatura.statusAssinatura === "INADIMPLENTE") {
    return prisma.assinatura.update({
      where: { id: assinatura.id },
      data: {
        statusAssinatura: "ATIVA",
        bloqueadoEm: null,
        motivoBloqueio: null,
      },
    });
  }

  return null;
}
