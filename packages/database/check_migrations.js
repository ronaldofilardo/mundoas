const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 10`;
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); });