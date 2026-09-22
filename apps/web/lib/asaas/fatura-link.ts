import { prisma } from "@/lib/db";
import { buscarOuCriarCustomer, criarCobrancaAvulsa, type BillingType } from "./client";

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

/**
 * Garante que uma fatura cadastrada no sistema (mesmo que criada manualmente
 * fora do Asaas) possua uma cobrança correspondente no gateway Asaas e retorna
 * a URL de pagamento (checkout).
 */
export async function garantirLinkFaturaAsaas(
  faturaId: string,
  contexto?: GarantirLinkContexto,
): Promise<string | null> {
  let fatura = contexto?.fatura;
  let bo = contexto?.backoffice;
  let asaasCustomerId = contexto?.asaasCustomerId;
  let assinaturaId = contexto?.assinaturaId;

  if (!fatura) {
    if (!prisma.faturaAsaas?.findUnique) return null;
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

    if (!faturaDb) return null;
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
    return fatura.linkFatura ?? null;
  }

  const isSandboxEnv = process.env.ASAAS_SANDBOX === "true";
  const linkEhSandbox = fatura.linkFatura?.includes("sandbox.asaas.com");

  // Se já possui link da fatura no Asaas e condizente com o ambiente, retorna imediatamente
  if (fatura.linkFatura && (!linkEhSandbox || isSandboxEnv)) {
    return fatura.linkFatura;
  }

  // Sem chave configurada do Asaas ou sem dados do backoffice, não é possível criar
  if (!process.env.ASAAS_API_KEY || !bo) {
    return null;
  }

  try {
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

    if (prisma.faturaAsaas?.update) {
      const atualizada = await prisma.faturaAsaas.update({
        where: { id: fatura.id },
        data: {
          asaasPaymentId: cobranca.id,
          linkFatura: cobranca.invoiceUrl ?? null,
          linkBoleto: cobranca.bankSlipUrl ?? null,
        },
      });
      return atualizada.linkFatura;
    }

    return cobranca.invoiceUrl ?? null;
  } catch (err) {
    console.error("[garantirLinkFaturaAsaas] Erro ao gerar cobrança no Asaas:", err);
    return null;
  }
}
