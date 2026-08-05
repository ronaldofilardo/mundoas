import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando backfill de backofficeId para comerciais...");

  // Buscar todos os comerciais sem backofficeId
  const comerciaisSemBackoffice = await prisma.comercial.findMany({
    where: {
      backofficeId: null,
    },
    include: {
      lideranca: {
        select: { backofficeId: true },
      },
    },
  });

  console.log(`Encontrados ${comerciaisSemBackoffice.length} comerciais sem backofficeId`);

  if (comerciaisSemBackoffice.length === 0) {
    console.log("Nenhum comercial para atualizar.");
    return;
  }

  // Buscar um backoffice padrão (o primeiro)
  const backofficePadrao = await prisma.backoffice.findFirst({
    select: { id: true },
  });

  if (!backofficePadrao) {
    console.error("ERRO: Nenhum backoffice encontrado no banco!");
    return;
  }

  console.log(`Backoffice padrão: ${backofficePadrao.id}`);

  let atualizados = 0;
  let semLideranca = 0;

  for (const comercial of comerciaisSemBackoffice) {
    let backofficeId = backofficePadrao.id;

    // Se o comercial tem liderança, usar o backoffice da liderança
    if (comercial.lideranca?.backofficeId) {
      backofficeId = comercial.lideranca.backofficeId;
    }

    await prisma.comercial.update({
      where: { id: comercial.id },
      data: { backofficeId },
    });

    if (comercial.lideranca?.backofficeId) {
      atualizados++;
    } else {
      semLideranca++;
    }
  }

  console.log(`✅ ${atualizados} comerciais atualizados via liderança`);
  console.log(`✅ ${semLideranca} comerciais atualizados com backoffice padrão`);
  console.log(`✅ Total: ${atualizados + semLideranca} comerciais corrigidos`);
}

main()
  .catch((e) => {
    console.error("Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });