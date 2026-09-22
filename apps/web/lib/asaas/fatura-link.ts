import { prisma } from "@/lib/db";
import {
  buscarOuCriarCustomer,
  buscarPagamento,
  criarCobrancaAvulsa,
  type BillingType,
} from "./client";

export interface GarantirLinkContexto {
  fatura?: {
    id: string;
    valor: number | { toString(): string };
    vencimento: Date | string;
    statusPagamento: string;
    formaPagamento?: string | null;
    pagoManualmente?: boolean;
    linkFatura?: string | null;
    linkBoleto?: string | null;
    asaasPaymentId?: string | null;
  };
  assinaturaId?: string;
  asaasCustomerId?: string | null;
  backoffice?: {
    id: string;
    nome: string;
    razaoSocial?: string | null;
    cpf: string;
    cnpj?: string | null;
    telefone?: string | null;
    usuario?: { email: string };
  } | null;
}

export type GarantirLinkResultado = {
  link: string | null;
  error?: string;
};

function linkDoPagamento(p: {
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  id?: string;
}): string | null {
  if (p.invoiceUrl) return p.invoiceUrl;
  if (p.bankSlipUrl) return p.bankSlipUrl;
  if (p.id) return `https://www.asaas.com/i/${p.id}`;
  return null;
}

/**
 * Garante que uma fatura cadastrada no sistema (mesmo que criada manualmente
 * fora do Asaas) possua uma cobrança correspondente no gateway Asaas e retorna
 * a URL de pagamento (checkout).
 */
export async function garantirLinkFaturaAsaas(
  faturaId: string,
  contexto?: GarantirLinkContexto,
): Promise<GarantirLinkResultado> {
  let fatura = contexto?.fatura;
  let bo = contexto?.backoffice;
  let asaasCustomerId = contexto?.asaasCustomerId;
  let assinaturaId = contexto?.assinaturaId;

  if (!fatura) {
    if (!prisma.faturaAsaas?.findUnique) return { link: null, error: "Fatura indisponível." };
    const faturaDb = await prisma.faturaAsaas.findUnique({
      where: { id: faturaId },
      include: {
        assinatura: {
          include: {
            backoffice: {
              select: {
                id: true,
                nome: true,
                razaoSocial: true,
                cpf: true,
                cnpj: true,
                telefone: true,
                usuario: { select: { email: true } },
              },
            },
          },
        },
      },
    });

    if (!faturaDb) return { link: null, error: "Fatura não encontrada." };
    fatura = faturaDb;
    bo = faturaDb.assinatura?.backoffice;
    asaasCustomerId = faturaDb.assinatura?.asaasCustomerId;
    assinaturaId = faturaDb.assinatura?.id;
  }

  // Se já está paga, não há o que cobrar no Asaas
  if (
    fatura.pagoManualmente ||
    fatura.statusPagamento === "CONFIRMED" ||
    fatura.statusPagamento === "RECEIVED"
  ) {
    return { link: fatura.linkFatura ?? fatura.linkBoleto ?? null };
  }

  const isSandboxEnv = process.env.ASAAS_SANDBOX === "true";
  const linkEhSandbox =
    Boolean(fatura.linkFatura?.includes("sandbox.asaas.com")) ||
    Boolean(fatura.linkBoleto?.includes("sandbox.asaas.com"));

  // Se já possui link da fatura no Asaas e condizente com o ambiente, retorna imediatamente
  if (fatura.linkFatura && (!linkEhSandbox || isSandboxEnv)) {
    return { link: fatura.linkFatura };
  }
  if (fatura.linkBoleto && (!linkEhSandbox || isSandboxEnv)) {
    return { link: fatura.linkBoleto };
  }

  if (!process.env.ASAAS_API_KEY) {
    return { link: null, error: "ASAAS_API_KEY não configurada no servidor." };
  }
  if (!bo) {
    return { link: null, error: "Dados da unidade incompletos para gerar cobrança." };
  }

  try {
    // Já existe cobrança no Asaas: reutiliza em vez de criar duplicada
    if (fatura.asaasPaymentId) {
      const existente = await buscarPagamento(fatura.asaasPaymentId);
      const linkExistente = existente ? linkDoPagamento(existente) : null;
      if (linkExistente) {
        if (prisma.faturaAsaas?.update) {
          await prisma.faturaAsaas.update({
            where: { id: fatura.id },
            data: {
              linkFatura: existente!.invoiceUrl ?? fatura.linkFatura ?? null,
              linkBoleto: existente!.bankSlipUrl ?? fatura.linkBoleto ?? null,
            },
          });
        }
        return { link: linkExistente };
      }
    }

    let customer;
    try {
      customer = await buscarOuCriarCustomer({
        name: bo.razaoSocial || bo.nome,
        cpfCnpj: bo.cnpj || bo.cpf,
        email: bo.usuario?.email || "",
        phone: bo.telefone,
        externalReference: bo.id,
      });
    } catch (errPrimeiraTentativa) {
      // Se falhou e tinha CNPJ e CPF, tenta com o CPF como contingência
      if (bo.cnpj && bo.cpf) {
        console.warn("[garantirLinkFaturaAsaas] Falha com CNPJ, tentando com CPF:", errPrimeiraTentativa);
        customer = await buscarOuCriarCustomer({
          name: bo.nome,
          cpfCnpj: bo.cpf,
          email: bo.usuario?.email || "",
          phone: bo.telefone,
          externalReference: bo.id,
        });
      } else {
        throw errPrimeiraTentativa;
      }
    }

    if (assinaturaId && prisma.assinatura?.update && asaasCustomerId !== customer.id) {
      await prisma.assinatura.update({
        where: { id: assinaturaId },
        data: { asaasCustomerId: customer.id },
      });
    }

    // O Asaas não aceita data de vencimento anterior a hoje para criação de nova cobrança
    const hojeStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()); // YYYY-MM-DD
    const vencimentoDate = fatura.vencimento instanceof Date ? fatura.vencimento : new Date(fatura.vencimento);
    const vencimentoStr = !isNaN(vencimentoDate.getTime()) ? vencimentoDate.toISOString().slice(0, 10) : hojeStr;
    const dueDate = vencimentoStr < hojeStr ? hojeStr : vencimentoStr;

    const billingType: BillingType =
      fatura.formaPagamento === "PIX" ? "PIX" : fatura.formaPagamento === "BOLETO" ? "BOLETO" : "UNDEFINED";

    const cobranca = await criarCobrancaAvulsa({
      customerId: customer.id,
      value: Number(fatura.valor),
      dueDate,
      billingType,
      description: `Fatura mundoAS — Unidade ${bo.nome}`,
      externalReference: bo.id,
    });

    const link = linkDoPagamento(cobranca);

    if (prisma.faturaAsaas?.update) {
      await prisma.faturaAsaas.update({
        where: { id: fatura.id },
        data: {
          asaasPaymentId: cobranca.id,
          linkFatura: cobranca.invoiceUrl ?? null,
          linkBoleto: cobranca.bankSlipUrl ?? null,
        },
      });
    }

    if (!link) {
      return { link: null, error: "Asaas criou a cobrança mas não retornou link de pagamento." };
    }
    return { link };
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Falha ao contatar o Asaas.";
    console.error("[garantirLinkFaturaAsaas] Erro ao gerar cobrança no Asaas:", err);
    return { link: null, error: mensagem };
  }
}
