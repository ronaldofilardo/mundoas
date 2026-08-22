import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe<Array<{ table_name: string; column_name: string }>>(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND column_name = 'gestor_pf_id'
     ORDER BY table_name`
  );
  console.log("Colunas gestor_pf_id ainda existentes:", cols);

  const idx = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(
    `SELECT indexname FROM pg_indexes
     WHERE schemaname = 'public' AND indexname LIKE '%gestor_pf_id%'`
  );
  console.log("Índices gestor_pf_id ainda existentes:", idx);
}

main().finally(() => prisma.$disconnect());
