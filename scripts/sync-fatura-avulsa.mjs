/**
 * Script one-shot: sincroniza o status de uma fatura avulsa com o Asaas.
 * 
 * Uso:
 *   $env:DATABASE_URL = '...'
 *   $env:ASAAS_API_KEY = 'aact_prod_...'
 *   $env:ASAAS_SANDBOX = 'false'
 *   node scripts/sync-fatura-avulsa.mjs pay_j1trw940kkfm8ur9
 * 
 * Ou para buscar por asaasPaymentId e marcar como CONFIRMED:
 *   node scripts/sync-fatura-avulsa.mjs <asaasPaymentId>
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const asaasPaymentId = process.argv[2];

if (!asaasPaymentId) {
  console.error("❌  Informe o asaasPaymentId como argumento.");
  console.error("    Exemplo: node scripts/sync-fatura-avulsa.mjs pay_j1trw940kkfm8ur9");
  process.exit(1);
}

// O payment ID da fatura paga no Asaas conforme a screenshot: pay_j1trw940kkfm8ur9
// mas o ID do log do Asaas era diferente — precisamos usar o que está no banco.

async function main() {
  console.log(`\n🔍  Buscando fatura no banco com asaasPaymentId = ${asaasPaymentId} ...`);

  let fatura = await prisma.faturaAsaas.findUnique({
    where: { asaasPaymentId },
    include: { assinatura: { include: { backoffice: { select: { nome: true } } } } },
  });

  if (!fatura) {
    // Tenta pelo ID interno também
    console.log("    Não encontrada por asaasPaymentId. Listando últimas 5 faturas PENDING...");
    const pendentes = await prisma.faturaAsaas.findMany({
      where: { statusPagamento: "PENDING" },
      orderBy: { criadoEm: "desc" },
      take: 5,
      include: { assinatura: { include: { backoffice: { select: { nome: true } } } } },
    });
    console.log("\nFaturas PENDING recentes:");
    for (const f of pendentes) {
      console.log(`  id=${f.id}  asaasPaymentId=${f.asaasPaymentId ?? "—"}  valor=${f.valor}  backoffice=${f.assinatura.backoffice?.nome}`);
    }
    process.exit(1);
  }

  console.log(`✅  Fatura encontrada:`);
  console.log(`    id           = ${fatura.id}`);
  console.log(`    backoffice   = ${fatura.assinatura.backoffice?.nome}`);
  console.log(`    valor        = R$${fatura.valor}`);
  console.log(`    status atual = ${fatura.statusPagamento}`);
  console.log(`    pagoManual   = ${fatura.pagoManualmente}`);

  if (["CONFIRMED", "RECEIVED"].includes(fatura.statusPagamento)) {
    console.log("\nℹ️   Fatura já está confirmada. Nada a fazer.");
    process.exit(0);
  }

  console.log("\n💾  Marcando como CONFIRMED...");
  await prisma.faturaAsaas.update({
    where: { id: fatura.id },
    data: {
      statusPagamento: "CONFIRMED",
      pagoEm: new Date(),
    },
  });

  console.log("✅  Status atualizado para CONFIRMED.");
  console.log("\n🎉  Concluído!");
}

main()
  .catch((err) => {
    console.error("\n❌  Erro:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
