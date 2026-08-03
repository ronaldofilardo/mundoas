import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

const CPFS = ["40658370065", "04705120086"];

// Grafias canônicas (com acento) que devem permanecer — Michelle: Cartão Acesso Saúde + CIRE Ativo
// Valeria: Franchising Acesso + Franchising Cartão + Unidade
// Remove QUALQUER outro vínculo desses dois consultores.
async function main() {
  for (const cpf of CPFS) {
    const consultor = await prisma.consultorPf.findUnique({
      where: { cpf },
      include: { setores: { include: { setor: true } } },
    });
    if (!consultor) { console.log(`CPF ${cpf} não encontrado.`); continue; }

    const nomesAtuais = consultor.setores.map((s) => s.setor.nome);
    console.log(`\n=== ${consultor.nome} ===`);
    console.log(`Antes: ${nomesAtuais.join(", ")}`);

    const removidos = await prisma.consultorPfSetor.deleteMany({
      where: { consultorPfId: consultor.id },
    });
    console.log(`Vínculos removidos: ${removidos.count}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
