import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const cpfs = ["40658370065", "04705120086"];
  for (const cpf of cpfs) {
    const c = await prisma.consultorPf.findUnique({
      where: { cpf },
      include: { setores: { include: { setor: true } } },
    });
    if (!c) { console.log(`CPF ${cpf} não encontrado.`); continue; }
    console.log(`\n=== ${c.nome} (${c.id}) ===`);
    for (const link of c.setores) {
      console.log(` - ${link.setor.nome} [${link.setor.ativo ? "ativo" : "inativo"}] (setor_id=${link.setorId})`);
    }
  }
}
main().finally(() => prisma.$disconnect());
