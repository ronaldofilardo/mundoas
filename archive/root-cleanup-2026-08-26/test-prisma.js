require('dotenv').config({ path: 'packages/database/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.usuario.findUnique({ where: { email: 'back@asa.com' } });
    console.log('RESULTADO PRISMA:', user ? user.email : 'NÃO ENCONTRADO');
  } catch (e) {
    console.error('ERRO:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
