#!/usr/bin/env tsx
/**
 * Script de Debug: Testa a API de Comerciais diretamente
 * Simula uma requisição HTTP real para /api/v1/backoffice/comerciais
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Debug: Verificando estado do banco e usuários...\n");

  // 1. Verificar se existe Backoffice
  const backoffices = await prisma.backoffice.findMany({
    include: { usuario: { select: { id: true, email: true, tipo: true } } },
  });
  console.log(`📊 Backoffices encontrados: ${backoffices.length}`);
  backoffices.forEach((b) => {
    console.log(`   - ${b.nome} | Email: ${b.usuario.email} | ID: ${b.id}`);
  });

  // 2. Verificar se existe usuário com tipo BACKOFFICE
  const usuariosBackoffice = await prisma.usuario.findMany({
    where: { tipo: "BACKOFFICE" },
    include: { backoffice: true },
  });
  console.log(`\n📊 Usuários com tipo BACKOFFICE: ${usuariosBackoffice.length}`);
  usuariosBackoffice.forEach((u) => {
    console.log(`   - ${u.nome} | Email: ${u.email} | ID: ${u.id}`);
  });

  // 3. Verificar Comerciais existentes
  const comerciais = await prisma.comercial.findMany({
    include: { usuario: { select: { email: true } }, backoffice: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  console.log(`\n📊 Comerciais (últimos 10): ${comerciais.length}`);
  comerciais.forEach((c) => {
    console.log(`   - ${c.nome} | CPF: ${c.cpf} | Email: ${c.usuario.email} | Backoffice: ${c.backoffice?.nome}`);
  });

  // 4. Criar um Backoffice de teste se não existir
  if (backoffices.length === 0) {
    console.log("\n🔧 Criando Backoffice de teste...\n");
    const testEmail = `backoffice-teste@asa.com`;
    
    // Verifica se já existe
    const existing = await prisma.usuario.findUnique({
      where: { email: testEmail },
    });

    let usuarioId = existing?.id;
    if (!existing) {
      const usuario = await prisma.usuario.create({
        data: {
          nome: "Backoffice Teste",
          email: testEmail,
          senhaHash: await hash("123456", 12),
          tipo: "GERENCIA",
        },
      });
      usuarioId = usuario.id;
      console.log(`✅ Usuário criado: ${testEmail}`);
    } else {
      console.log(`ℹ️  Usuário já existe: ${testEmail}`);
    }

    const backoffice = await prisma.backoffice.findUnique({
      where: { usuarioId: usuarioId! },
    });

    if (!backoffice) {
      await prisma.backoffice.create({
        data: {
          usuarioId: usuarioId!,
          nome: "Backoffice Teste",
          cpf: "12345678901",
        },
      });
      console.log(`✅ Backoffice vinculado criado`);
    }

    console.log("\n📝 Use estas credenciais para testar no frontend:");
    console.log(`   Email: ${testEmail}`);
    console.log(`   Senha: 123456`);
  }

  // 5. Verificar schema do Comercial
  console.log("\n📋 Verificando schema da tabela Comercial...");
  const sampleComercial = await prisma.comercial.findFirst();
  if (sampleComercial) {
    console.log("   Campos do Comercial:", Object.keys(sampleComercial).join(", "));
  }

  await prisma.$disconnect();
  console.log("\n✅ Debug completo!");
}

main().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});