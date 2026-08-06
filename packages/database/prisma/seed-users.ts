import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senhaPadrao = await hash("123456", 12);

  // 1. Admin
  const admin = await prisma.usuario.upsert({
    where: { email: "admin@asa.com" },
    update: { senhaHash: senhaPadrao, senhaTemporaria: false },
    create: {
      nome: "Administrador",
      email: "admin@asa.com",
      senhaHash: senhaPadrao,
      tipo: "ADMIN",
      papel: null,
      senhaTemporaria: false,
    },
  });
  console.log("OK Admin:", admin.email);

  // 2. Backoffice (Pessoa Fisica) - tipo BACKOFFICE
  const backofficeUsuario = await prisma.usuario.upsert({
    where: { email: "backoffice@asa.com" },
    update: {
      senhaHash: senhaPadrao,
      senhaTemporaria: false,
      tipo: "BACKOFFICE",
      papel: "BACKOFFICE",
    },
    create: {
      nome: "Backoffice Admin",
      email: "backoffice@asa.com",
      senhaHash: senhaPadrao,
      tipo: "BACKOFFICE",
      papel: "BACKOFFICE",
      senhaTemporaria: false,
    },
  });
  await prisma.backoffice.upsert({
    where: { usuarioId: backofficeUsuario.id },
    update: { cpf: "12345678901" },
    create: {
      usuarioId: backofficeUsuario.id,
      nome: backofficeUsuario.nome,
      cpf: "12345678901",
    },
  });
  console.log("OK Backoffice:", backofficeUsuario.email, "papel=BACKOFFICE");

  console.log("\n2 usuarios semeados com senha 123456");
  console.log("   Admin       -> /login (apenas visual)");
  console.log("   Backoffice  -> /backoffice/dashboard  (papel=BACKOFFICE)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
