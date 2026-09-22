import { prisma } from "@/lib/db";

/**
 * Retorna a data no formato YYYY-MM-DD considerando o fuso horário de Brasília (America/Sao_Paulo).
 */
export function extrairDataBrasilia(data: Date | string = new Date()): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Calcula a diferença em dias corridos entre uma data de referência e o vencimento da fatura.
 * Retorna positivo se estiver vencido (ex: 1 para venceu ontem, 15 para 15 dias de atraso),
 * 0 se vence hoje, e negativo se ainda for vencer.
 */
export function calcularDiasAtraso(
  vencimento: Date | string,
  dataReferencia: Date | string = new Date(),
): number {
  let vStr: string;
  if (typeof vencimento === "string") {
    const match = vencimento.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    vStr = match ? `${match[1]}-${match[2]}-${match[3]}` : extrairDataBrasilia(new Date(vencimento));
  } else {
    vStr = extrairDataBrasilia(vencimento);
  }

  const refStr = typeof dataReferencia === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dataReferencia.trim())
    ? dataReferencia.trim()
    : extrairDataBrasilia(dataReferencia);

  const [vAno, vMes, vDia] = vStr.split("-").map(Number);
  const [rAno, rMes, rDia] = refStr.split("-").map(Number);

  const utcVenc = Date.UTC(vAno, vMes - 1, vDia);
  const utcRef = Date.UTC(rAno, rMes - 1, rDia);

  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.floor((utcRef - utcVenc) / msPorDia);
}

/**
 * Status de fatura que o sistema considera "paga" (baixa manual ou gateway).
 * RECEIVED = PIX/boleto compensado no Asaas; CONFIRMED = baixa manual ou
 * confirmação de settlement. Qualquer um dos dois libera a unidade.
 */
export const STATUS_FATURA_PAGA = ["CONFIRMED", "RECEIVED"] as const;

export function isFaturaPaga(fatura: {
  pagoManualmente?: boolean;
  statusPagamento?: string | null;
}): boolean {
  if (fatura.pagoManualmente) return true;
  return (
    fatura.statusPagamento === "CONFIRMED" ||
    fatura.statusPagamento === "RECEIVED"
  );
}

/**
 * Verifica se a fatura já possui atraso >= 15 dias (elegível para reenvio pelo admin).
 * Exemplo: vencimento dia 15 -> dia 30 em diante já tem >= 15 dias de diferença.
 */
export function isFaturaAtrasada15Dias(fatura: {
  vencimento: Date | string;
  pagoManualmente?: boolean;
  statusPagamento?: string;
}, dataReferencia?: Date | string): boolean {
  if (isFaturaPaga(fatura)) return false;

  const atraso = calcularDiasAtraso(fatura.vencimento, dataReferencia);
  return atraso >= 15;
}

/**
 * Regra de corte/bloqueio automático:
 * A tolerância é de 15 dias corridos após o vencimento (dias 16 a 30 para vcto dia 15).
 * O corte ocorre a partir do 16º dia de atraso (diasAtraso > 15), ou seja, exatamente
 * no dia 31 do mês (ou no dia 1º do mês seguinte nos meses de 30 dias).
 */
export function isFaturaBloqueavel(fatura: {
  vencimento: Date | string;
  pagoManualmente?: boolean;
  statusPagamento?: string;
}, dataReferencia?: Date | string): boolean {
  if (isFaturaPaga(fatura)) return false;

  const atraso = calcularDiasAtraso(fatura.vencimento, dataReferencia);
  return atraso > 15;
}

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
