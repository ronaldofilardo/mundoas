import { prisma } from "@/lib/db";
import { buscarPagamento } from "./client";

const STATUS_PAGO = new Set(["RECEIVED", "CONFIRMED"]);

type FaturaSincronizavel = {
  id: string;
  statusPagamento: string;
  pagoManualmente?: boolean | null;
  asaasPaymentId?: string | null;
  linkFatura?: string | null;
  linkBoleto?: string | null;
  pagoEm?: Date | null;
};

/**
 * Fallback do webhook: para faturas ainda PENDING no banco que já têm
 * cobrança no Asaas, consulta o status real e baixa se o pagamento
 * já foi recebido (ex.: webhook com 401 / evento perdido).
 */
export async function sincronizarStatusComAsaas<T extends FaturaSincronizavel>(
  faturas: T[],
): Promise<T[]> {
  const candidatas = faturas.filter(
    (f) =>
      !f.pagoManualmente &&
      !STATUS_PAGO.has(f.statusPagamento) &&
      Boolean(f.asaasPaymentId),
  );

  if (candidatas.length === 0) return faturas;

  const atualizacoes = new Map<string, Partial<T>>();

  await Promise.all(
    candidatas.map(async (fatura) => {
      try {
        const pagamento = await buscarPagamento(fatura.asaasPaymentId!);
        if (!pagamento) return;

        const linkFatura = pagamento.invoiceUrl ?? fatura.linkFatura ?? null;
        const linkBoleto = pagamento.bankSlipUrl ?? fatura.linkBoleto ?? null;

        if (!STATUS_PAGO.has(pagamento.status)) {
          if (linkFatura !== fatura.linkFatura || linkBoleto !== fatura.linkBoleto) {
            if (prisma.faturaAsaas?.update) {
              await prisma.faturaAsaas.update({
                where: { id: fatura.id },
                data: { linkFatura, linkBoleto },
              });
            }
            atualizacoes.set(fatura.id, { linkFatura, linkBoleto } as Partial<T>);
          }
          return;
        }

        const pagoEm =
          pagamento.paidDate || pagamento.paymentDate || pagamento.clientPaymentDate
            ? new Date(pagamento.paidDate || pagamento.paymentDate || pagamento.clientPaymentDate!)
            : fatura.pagoEm ?? new Date();

        if (prisma.faturaAsaas?.update) {
          await prisma.faturaAsaas.update({
            where: { id: fatura.id },
            data: {
              statusPagamento: pagamento.status as never,
              linkFatura,
              linkBoleto,
              pagoEm,
            },
          });
        }

        atualizacoes.set(fatura.id, {
          statusPagamento: pagamento.status,
          linkFatura,
          linkBoleto,
          pagoEm,
        } as Partial<T>);
      } catch (err) {
        console.warn("[sincronizarStatusComAsaas] Falha ao consultar fatura:", {
          faturaId: fatura.id,
          err,
        });
      }
    }),
  );

  if (atualizacoes.size === 0) return faturas;

  return faturas.map((f) => {
    const patch = atualizacoes.get(f.id);
    return patch ? { ...f, ...patch } : f;
  });
}
