import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const all = await prisma.equipe.findMany({
    where: { tipo: 'LIDERANCA' },
    include: { consultorPfs: { include: { usuario: true, setores: { include: { setor: true } } } } }
  })
  console.log(JSON.stringify(all, null, 2))
}
main().finally(() => prisma.$disconnect())