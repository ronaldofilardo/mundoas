import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const SEED: Array<{ cpf: string; setores: string[] }> = [
  { cpf: "40658370065", setores: ["Cartão Acesso Saúde", "CIRE Ativo"] },
  { cpf: "04705120086", setores: ["Franchising Acesso", "Franchising Cartão", "Unidade"] },
];

async function ensureSetor(nome: string): Promise<string> {
  const existentes = await prisma.setor.findMany({
    where: { nome, ativo: true },
    select: { id: true },
  });
  if (existentes.length > 0) return existentes[0].id;

  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO "setores" ("id", "nome", "descricao", "ativo") VALUES (gen_random_uuid(), ${nome}, ${`Setor ${nome}`}, true)`
  );
  const criado = await prisma.setor.findFirst({ where: { nome }, select: { id: true } });
  if (!criado) throw new Error(`Falha ao criar setor ${nome}`);
  return criado.id;
}

async function main() {
  // Garante os 6 setores ativos e obtém os IDs.
  const setorIdPorNome = new Map<string, string>();
  for (const item of SEED) {
    for (const nome of item.setores) {
      if (!setorIdPorNome.has(nome)) {
        const id = await ensureSetor(nome);
        setorIdPorNome.set(nome, id);
        console.log(`[setor] ${nome} → ${id}`);
      }
    }
  }

  for (const item of SEED) {
    const consultor = await prisma.consultorPf.findUnique({
      where: { cpf: item.cpf },
      select: { id: true, nome: true },
    });
    if (!consultor) {
      console.error(`[skip] Consultor CPF ${item.cpf} não encontrado.`);
      continue;
    }
    console.log(`[ok] Consultor encontrado: ${consultor.nome} (${consultor.id})`);

    for (const nome of item.setores) {
      const setorId = setorIdPorNome.get(nome)!;
      await prisma.$executeRaw(
        Prisma.sql`
          INSERT INTO "consultor_pf_setores" ("id", "consultor_pf_id", "setor_id")
          VALUES (gen_random_uuid(), ${consultor.id}::uuid, ${setorId}::uuid)
          ON CONFLICT ("consultor_pf_id", "setor_id") DO NOTHING
        `
      );
    }

    const total = await prisma.consultorPfSetor.count({ where: { consultorPfId: consultor.id } });
    console.log(`[ok] ${consultor.nome}: ${total} setor(es) vinculado(s).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
