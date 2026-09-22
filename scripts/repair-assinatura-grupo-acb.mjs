/**
 * Script one-shot: cria Assinatura no banco + Customer + Subscription no Asaas
 * para o Grupo ACB (luiggi.romao@acessosaude.com.br).
 *
 * Uso:
 *   cd C:\apps\mundoas
 *   node --env-file=apps/web/.env.local scripts/repair-assinatura-grupo-acb.mjs
 *
 * O script é idempotente: verifica existência antes de criar.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Constantes do plano (copiadas de lib/legal/mundoas-termos.ts) ───────────
const PLANOS = {
  MENSAL: { label: "Mensal", valor: 350 },
};
const DIA_VENCIMENTO = 15;

// ── Config Asaas ─────────────────────────────────────────────────────────────
const ASAAS_SANDBOX = process.env.ASAAS_SANDBOX === "true";
const BASE_URL = ASAAS_SANDBOX
  ? "https://sandbox.asaas.com/api/v3"
  : "https://api.asaas.com/v3";
const API_KEY = process.env.ASAAS_API_KEY;

if (!API_KEY) {
  console.error("❌  ASAAS_API_KEY não configurada. Rode com --env-file=apps/web/.env.local");
  process.exit(1);
}

console.log(`\n🌐  Asaas: ${ASAAS_SANDBOX ? "SANDBOX" : "PRODUÇÃO"}`);

// ── Utilitários ───────────────────────────────────────────────────────────────
async function asaasFetch(path, init = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: API_KEY,
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      Array.isArray(data?.errors) && data.errors[0]?.description
        ? data.errors[0].description
        : `Erro ${res.status} ao chamar Asaas.`;
    throw new Error(msg);
  }
  return data;
}

function proximoVencimento(dia) {
  const now = new Date(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()).split("/").reverse().join("-") // dd/mm/yyyy → yyyy-mm-dd
  );
  const diaAtual = now.getDate();
  let mes = now.getMonth() + 1;
  let ano = now.getFullYear();
  if (diaAtual >= dia) {
    mes += 1;
    if (mes > 12) { mes = 1; ano += 1; }
  }
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

// ── Email alvo ────────────────────────────────────────────────────────────────
const EMAIL_ALVO = "luiggi.romao@acessosaude.com.br";
const TERMOS_ACEITOS_EM = new Date("2026-08-28T12:00:00-03:00"); // aceite informado
const METODO = "BOLETO"; // conforme solicitado

async function main() {
  // 1. Buscar backoffice pelo email do usuário
  console.log(`\n🔍  Buscando usuário ${EMAIL_ALVO}...`);
  const usuario = await prisma.usuario.findFirst({
    where: { email: EMAIL_ALVO },
    include: {
      backoffice: {
        include: { assinatura: true },
      },
    },
  });

  if (!usuario) {
    throw new Error(`Usuário ${EMAIL_ALVO} não encontrado no banco.`);
  }
  if (!usuario.backoffice) {
    throw new Error(`Usuário encontrado mas sem backoffice associado.`);
  }

  const bo = usuario.backoffice;
  console.log(`✅  Backoffice encontrado: "${bo.nome}" (id=${bo.id})`);
  console.log(`    CNPJ: ${bo.cnpj ?? "—"}  CPF: ${bo.cpf ?? "—"}`);

  // 2. Verificar/criar Assinatura no banco
  let assinatura = bo.assinatura;
  if (assinatura) {
    console.log(`\nℹ️   Assinatura já existe no banco (id=${assinatura.id}, status=${assinatura.statusAssinatura})`);
    if (assinatura.asaasSubscriptionId) {
      console.log(`⚠️   asaasSubscriptionId já preenchido: ${assinatura.asaasSubscriptionId}`);
      console.log("    Abortando para não duplicar. Remova o ID manualmente se quiser recriar.");
      process.exit(0);
    }
  } else {
    console.log(`\n📄  Assinatura não existe. Criando no banco...`);
    assinatura = await prisma.assinatura.create({
      data: {
        backofficeId: bo.id,
        statusAssinatura: "PENDENTE_PAGAMENTO",
        planoAssinatura: "MENSAL",
        termosAceitosEm: TERMOS_ACEITOS_EM,
        termosAceitosIp: "manual-admin",
        termosVersao: "2026-09-02-v1",
      },
    });
    console.log(`✅  Assinatura criada no banco: id=${assinatura.id}`);
  }

  // 3. Criar ou buscar Customer no Asaas
  const cpfCnpjLimpo = (bo.cnpj || bo.cpf || "").replace(/\D/g, "");
  if (!cpfCnpjLimpo) {
    throw new Error("Backoffice sem CNPJ nem CPF — necessário para criar Customer no Asaas.");
  }

  console.log(`\n🔍  Buscando customer no Asaas por CPF/CNPJ ${cpfCnpjLimpo}...`);
  const existentes = await asaasFetch(`/customers?cpfCnpj=${cpfCnpjLimpo}`);
  let customer;
  if (existentes.data?.length > 0) {
    customer = existentes.data[0];
    console.log(`✅  Customer já existe no Asaas: id=${customer.id}`);
  } else {
    console.log("    Criando novo customer no Asaas...");
    customer = await asaasFetch("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: bo.razaoSocial || bo.nome,
        cpfCnpj: cpfCnpjLimpo,
        email: usuario.email,
        phone: bo.telefone || undefined,
        externalReference: bo.id,
      }),
    });
    console.log(`✅  Customer criado no Asaas: id=${customer.id}`);
  }

  // 4. Criar Subscription no Asaas
  const nextDueDate = proximoVencimento(DIA_VENCIMENTO);
  console.log(`\n📋  Criando subscription no Asaas (BOLETO, MENSAL, R$350, vencimento=${nextDueDate})...`);
  const subscription = await asaasFetch("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: customer.id,
      billingType: METODO,
      value: PLANOS.MENSAL.valor,
      cycle: "MONTHLY",
      nextDueDate,
      description: "Licença de uso da plataforma mundoAS — plano Mensal",
      externalReference: bo.id,
    }),
  });
  console.log(`✅  Subscription criada no Asaas: id=${subscription.id}`);

  // 5. Salvar IDs no banco + marcar ATIVA
  console.log(`\n💾  Salvando IDs na assinatura e marcando como ATIVA...`);
  await prisma.assinatura.update({
    where: { id: assinatura.id },
    data: {
      asaasCustomerId: customer.id,
      asaasSubscriptionId: subscription.id,
      planoAssinatura: "MENSAL",
      statusAssinatura: "ATIVA",
    },
  });
  console.log("✅  Assinatura atualizada no banco.");

  // 6. Buscar primeira fatura e salvar
  console.log(`\n📄  Buscando primeira fatura da subscription...`);
  const faturasResult = await asaasFetch(`/payments?subscription=${subscription.id}&limit=1`);
  const primeiraFatura = faturasResult.data?.[0] ?? null;

  if (primeiraFatura) {
    await prisma.faturaAsaas.upsert({
      where: { asaasPaymentId: primeiraFatura.id },
      create: {
        assinaturaId: assinatura.id,
        asaasPaymentId: primeiraFatura.id,
        valor: primeiraFatura.value,
        vencimento: new Date(primeiraFatura.dueDate),
        statusPagamento: "PENDING",
        formaPagamento: "BOLETO",
        linkFatura: primeiraFatura.invoiceUrl ?? null,
        linkBoleto: primeiraFatura.bankSlipUrl ?? null,
      },
      update: {
        linkFatura: primeiraFatura.invoiceUrl ?? null,
        linkBoleto: primeiraFatura.bankSlipUrl ?? null,
      },
    });
    console.log(`✅  Fatura salva: id=${primeiraFatura.id}, vencimento=${primeiraFatura.dueDate}`);
    if (primeiraFatura.bankSlipUrl) {
      console.log(`\n🔗  Link do boleto:\n    ${primeiraFatura.bankSlipUrl}`);
    }
    if (primeiraFatura.invoiceUrl) {
      console.log(`🔗  Link da fatura:\n    ${primeiraFatura.invoiceUrl}`);
    }
  } else {
    console.log("⚠️   Nenhuma fatura gerada ainda — verifique no painel Asaas.");
  }

  console.log(`\n🎉  Concluído com sucesso!`);
  console.log(`    Backoffice : ${bo.nome}`);
  console.log(`    Assinatura : ${assinatura.id}`);
  console.log(`    Status     : ATIVA`);
  console.log(`    Customer   : ${customer.id}`);
  console.log(`    Subscription: ${subscription.id}`);
}

main()
  .catch((err) => {
    console.error("\n❌  Erro:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
