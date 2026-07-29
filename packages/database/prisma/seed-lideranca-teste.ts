import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await hash("123456", 12);
  const email = "lider01@asa.com";
  const cpf = "53051173991";

  const backoffice = await prisma.backoffice.findFirst();
  if (!backoffice) {
    throw new Error("Nenhum backoffice encontrado. Rode o seed principal antes.");
  }

  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: {
      senhaHash,
      senhaTemporaria: false,
      tipo: "LIDERANCA",
      status: "ATIVO",
    },
    create: {
      nome: "Liderança Teste",
      email,
      senhaHash,
      senhaTemporaria: false,
      tipo: "LIDERANCA",
      status: "ATIVO",
    },
  });

  await prisma.lideranca.upsert({
    where: { cpf },
    update: {
      usuarioId: usuario.id,
      backofficeId: backoffice.id,
      tipo: "COMERCIAL",
      status: "ATIVO",
    },
    create: {
      usuarioId: usuario.id,
      nome: "Liderança Teste",
      cpf,
      backofficeId: backoffice.id,
      tipo: "COMERCIAL",
      status: "ATIVO",
    },
  });

  console.log(`✅ Liderança seedada: ${email} (cpf ${cpf}) com senha 123456`);
}

main()
  .catch((e) => {
    console.error("Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
