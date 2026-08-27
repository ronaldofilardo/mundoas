import { prisma } from "@asa/database";

function normalizarChave(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Retorna os setores elegíveis para Consultor PF no Backoffice da liderança.
 *
 * Os itens CUSTOM de RegraComercial são a fonte de verdade de
 * `Regras: Consultores`. A tabela `setores` pode estar incompleta em bases
 * antigas, por isso itens válidos da regra que ainda não possuem uma linha
 * correspondente também são retornados. O POST de cadastro materializa a
 * linha antes de criar o vínculo do consultor.
 */
export async function buscarSetoresDaRegraConsultores(backofficeId: string) {
  const [regra, setoresAtivos] = await Promise.all([
    prisma.regraComercial.findUnique({
      where: { backofficeId },
      select: {
        itens: {
          where: { tipo: "CUSTOM" },
          select: { nome: true, ordem: true },
          orderBy: { ordem: "asc" },
        },
      },
    }),
    prisma.setor.findMany({
      where: { backofficeId, ativo: true },
      select: { id: true, nome: true, descricao: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const setoresPorChave = new Map(
    setoresAtivos.map((setor) => [normalizarChave(setor.nome), setor]),
  );
  const itensDaRegra = regra?.itens ?? [];

  return itensDaRegra.map((item, index) => {
    const chave = normalizarChave(item.nome);
    const setor = setoresPorChave.get(chave);
    return setor ?? {
      id: `regra-${backofficeId}-${index}`,
      nome: item.nome,
      descricao: null,
    };
  });
}

export { normalizarChave };
