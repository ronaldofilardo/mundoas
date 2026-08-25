import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin
  const senhaAdmin = await hash("123456", 12);
  await prisma.usuario.upsert({
    where: { email: "admin@asa.com" },
    update: { senhaHash: senhaAdmin, senhaTemporaria: false, status: "ATIVO" },
    create: {
      nome: "Administrador",
      email: "admin@asa.com",
      senhaHash: senhaAdmin,
      tipo: "ADMIN",
      papel: null,
      senhaTemporaria: false,
      status: "ATIVO",
    },
  });

  // Backoffice (back@asa.com)
  const senhaBack = await hash("123456", 12);
  const backUsuario = await prisma.usuario.upsert({
    where: { email: "back@asa.com" },
    update: {
      senhaHash: senhaBack,
      senhaTemporaria: false,
      tipo: "BACKOFFICE",
      papel: "BACKOFFICE",
      status: "ATIVO",
    },
    create: {
      nome: "BackOffice Admin",
      email: "back@asa.com",
      senhaHash: senhaBack,
      tipo: "BACKOFFICE",
      papel: "BACKOFFICE",
      senhaTemporaria: false,
      status: "ATIVO",
    },
  });

  await prisma.backoffice.upsert({
    where: { usuarioId: backUsuario.id },
    update: { cpf: "12345678901" },
    create: {
      usuarioId: backUsuario.id,
      nome: "BackOffice Admin",
      cpf: "12345678901",
      percentualComissaoDefault: 5.0,
      percentualComissaoMax: 100.0,
    },
  });

  // Backoffice (backoffice@asa.com) - mantém compatibilidade
  const senhaBackoffice = await hash("123456", 12);
  const backofficeUsuario = await prisma.usuario.upsert({
    where: { email: "backoffice@asa.com" },
    update: {
      senhaHash: senhaBackoffice,
      senhaTemporaria: false,
      tipo: "BACKOFFICE",
      papel: "BACKOFFICE",
      status: "ATIVO",
    },
    create: {
      nome: "Backoffice Admin",
      email: "backoffice@asa.com",
      senhaHash: senhaBackoffice,
      tipo: "BACKOFFICE",
      papel: "BACKOFFICE",
      senhaTemporaria: false,
      status: "ATIVO",
    },
  });

  await prisma.backoffice.upsert({
    where: { usuarioId: backofficeUsuario.id },
    update: { cpf: "12345678999" },
    create: {
      usuarioId: backofficeUsuario.id,
      nome: "Backoffice Admin",
      cpf: "12345678999",
      percentualComissaoDefault: 5.0,
      percentualComissaoMax: 100.0,
    },
  });

  // Gestor PJ
  const senhaGestorPj = await hash("123456", 12);
  await prisma.usuario.upsert({
    where: { email: "gestor-pj@asa.com" },
    update: {
      senhaHash: senhaGestorPj,
      senhaTemporaria: false,
      tipo: "GESTOR_PJ",
      papel: "GESTOR_PJ",
      status: "ATIVO",
    },
    create: {
      nome: "Gestor Pessoa Jurídica",
      email: "gestor-pj@asa.com",
      senhaHash: senhaGestorPj,
      tipo: "GESTOR_PJ",
      papel: "GESTOR_PJ",
      senhaTemporaria: false,
      status: "ATIVO",
    },
  });

  // Consultor
  const senhaConsultor = await hash("123456", 12);
  const consultorUsuario = await prisma.usuario.upsert({
    where: { email: "consultor@asa.com" },
    update: { senhaHash: senhaConsultor, senhaTemporaria: false, status: "ATIVO" },
    create: {
      nome: "Consultor",
      email: "consultor@asa.com",
      senhaHash: senhaConsultor,
      tipo: "CONSULTOR",
      papel: null,
      senhaTemporaria: false,
      status: "ATIVO",
    },
  });

  const consultorRecord = await prisma.consultor.upsert({
    where: { usuarioId: consultorUsuario.id },
    update: { cpf: "12345678903" },
    create: {
      usuarioId: consultorUsuario.id,
      cpf: "12345678903",
    },
  });

  // Liderança
  const senhaLider = await hash("123456", 12);
  const liderUsuario = await prisma.usuario.upsert({
    where: { email: "lider01@asa.com" },
    update: {
      senhaHash: senhaLider,
      senhaTemporaria: false,
      tipo: "LIDERANCA",
      status: "ATIVO",
    },
    create: {
      nome: "Lider01",
      email: "lider01@asa.com",
      senhaHash: senhaLider,
      tipo: "LIDERANCA",
      papel: null,
      senhaTemporaria: false,
      status: "ATIVO",
    },
  });

  const backofficeLider = await prisma.backoffice.findFirst();
  if (!backofficeLider) {
    throw new Error("Nenhum backoffice encontrado para associar à liderança.");
  }

  await prisma.lideranca.upsert({
    where: { cpf: "06566698027" },
    update: {
      usuarioId: liderUsuario.id,
      backofficeId: backofficeLider.id,
      tipo: "GESTOR",
      status: "ATIVO",
    },
    create: {
      usuarioId: liderUsuario.id,
      nome: "Lider01",
      cpf: "06566698027",
      backofficeId: backofficeLider.id,
      tipo: "GESTOR",
      status: "ATIVO",
    },
  });


  console.log("✅ Seed executado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
