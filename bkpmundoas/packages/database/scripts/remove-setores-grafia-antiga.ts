import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

const CPFS = ["40658370065", "04705120086"];

async function main() {
  // Setores a remover dos consultores (grafias antigas, sem acento/til)
  const nomesAntigos = ["Cartao Acesso Saude", "Franquias Acesso", "Franquias Cartao"];

  const setoresAntigos = await prisma.setor.findMany({
    where: { nome: { in: nomesAntigos } },
    select: { id: true, nome: true },
  });
  console.log("Setores antigos encontrados:", setoresAntigos.map((s) => s.nome));

  if (!setoresAntigos.length) {
    console.log("Nada a remover.");
    return;
  }

  const result = await prisma.consultorPfSetor.deleteMany({
    where: {
      setorId: { in: setoresAntigos.map((s) => s.id) },
      consultorPf: { cpf: { in: CPFS } },
    },
  });
  console.log(`Vínculos removidos: ${result.count}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
