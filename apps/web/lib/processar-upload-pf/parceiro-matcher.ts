import { prisma } from "@asa/database";
import { normalizarCpf, normalizarNome } from "./helpers";

export interface MapsEquipe {
  consultorPorNome: Map<string, string>;
  comercialPorNome: Map<string, string>;
  gestorPorNome: Map<string, string>;
}

export interface ParceiroResumo {
  id: string;
  cpf: string;
  comercialId: string | null;
  gestorId: string | null;
  indicacoes: { id: string; cpf: string }[];
}

export interface ResultadoMatching {
  parceiroEncontrado: ParceiroResumo | null;
  indicadoId: string | null;
  consultorPfId: string | null;
  comercialId: string | null;
  gestorIdFromNome: string | null;
  orfao: boolean;
  motivosOrfao: string[];
}

export async function carregarMapsEquipe(backofficeId: string): Promise<MapsEquipe> {
  const liderancas = await prisma.equipe.findMany({
    where: { backofficeId, tipo: "LIDERANCA" },
    select: { id: true },
  });
  const liderancaIds = liderancas.map((l) => l.id);

  const [comerciais, consultoresPf, gestores] = await Promise.all([
    prisma.equipe.findMany({
      where: { liderancaId: { in: liderancaIds } },
      select: { id: true, nome: true },
    }),
    prisma.consultorPf.findMany({
      where: { liderancaId: { in: liderancaIds }, status: "ATIVO" },
      select: { id: true, nome: true },
    }),
    prisma.gestor.findMany({
      where: { lideranca: { backofficeId } },
      select: { id: true, nome: true },
    }),
  ]);

  const consultorPorNome = new Map(
    consultoresPf.map((c) => [normalizarNome(c.nome), c.id]),
  );
  const comercialPorNome = new Map(
    comerciais.map((c) => [normalizarNome(c.nome), c.id]),
  );
  const gestorPorNome = new Map(
    gestores.map((g) => [normalizarNome(g.nome), g.id]),
  );

  return { consultorPorNome, comercialPorNome, gestorPorNome };
}

export async function carregarParceiros(
  backofficeId: string,
): Promise<ParceiroResumo[]> {
  return prisma.parceiro.findMany({
    where: { backofficeId },
    select: {
      id: true,
      nome: true,
      cpf: true,
      comercialId: true,
      gestorId: true,
      indicacoes: {
        select: {
          id: true,
          cpf: true,
        },
      },
    },
  });
}

export function resolverMatching(
  cpf: string,
  cpfValido: boolean,
  usuarioDaConta: string,
  parceiros: ParceiroResumo[],
  maps: MapsEquipe,
): ResultadoMatching {
  let parceiroEncontrado: ParceiroResumo | null = null;
  let indicadoId: string | null = null;
  let consultorPfId: string | null = null;
  let comercialId: string | null = null;
  let gestorIdFromNome: string | null = null;
  let orfao = false;
  const motivosOrfao: string[] = [];

  if (!cpfValido) {
    orfao = true;
    motivosOrfao.push("cpf_invalido_ou_ausente");
  } else {
    parceiroEncontrado =
      parceiros.find((p) => normalizarCpf(p.cpf) === cpf) ?? null;

    if (!parceiroEncontrado) {
      for (const parceiro of parceiros) {
        const indicado = parceiro.indicacoes.find(
          (ind) => normalizarCpf(ind.cpf) === cpf,
        );
        if (indicado) {
          parceiroEncontrado = parceiro;
          indicadoId = indicado.id;
          break;
        }
      }
    }

    if (!parceiroEncontrado) {
      orfao = true;
      motivosOrfao.push("parceiro_nao_encontrado");
    }
  }

  if (usuarioDaConta) {
    const nomeNormalizado = normalizarNome(usuarioDaConta);
    consultorPfId = maps.consultorPorNome.get(nomeNormalizado) ?? null;
    comercialId = maps.comercialPorNome.get(nomeNormalizado) ?? null;
    gestorIdFromNome = maps.gestorPorNome.get(nomeNormalizado) ?? null;
  }

  if (orfao && consultorPfId) {
    orfao = false;
    motivosOrfao.length = 0;
  }

  return {
    parceiroEncontrado,
    indicadoId,
    consultorPfId,
    comercialId,
    gestorIdFromNome,
    orfao,
    motivosOrfao,
  };
}