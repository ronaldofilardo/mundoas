import { prisma } from "@asa/database";

function normalizarChave(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export async function buscarSetoresDaRegraConsultores(backofficeId: string) {
  const [regra, setoresAtivos] = await Promise.all([
    prisma.regraComercial.findUnique({
      where: { backofficeId },
      select: {
        itens: {
          where: { tipo: "CUSTOM" },
          select: { nome: true },
        },
      },
    }),
    prisma.setor.findMany({
      where: { backofficeId, ativo: true },
      select: { id: true, nome: true, descricao: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const permitidos = new Set(
    (regra?.itens ?? []).map((item) => normalizarChave(item.nome)),
  );

  return setoresAtivos.filter((setor) => permitidos.has(normalizarChave(setor.nome)));
}
