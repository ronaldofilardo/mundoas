import { prisma } from "@asa/database";

export type VersaoComercial = {
  id: string;
  regraComercialId: string;
  competencia: string;
  cartaoAcessoSaude: number;
  cireAtivo: number;
  cireReceptivo: number;
  franchisingAcesso: number;
  franchisingCartao: number;
  unidade: number;
};

const camposComerciais = [
  "cartao_acesso_saude",
  "cire_ativo",
  "cire_receptivo",
  "franchising_acesso",
  "franchising_cartao",
  "unidade",
] as const;

export async function buscarVersaoComercial(
  regraComercialId: string,
  competencia: string,
): Promise<VersaoComercial | null> {
  const delegate = (prisma as any).regraComercialVersao;
  if (delegate?.findUnique) {
    return delegate.findUnique({
      where: {
        regraComercialId_competencia: { regraComercialId, competencia },
      },
    });
  }

  const rows = await prisma.$queryRawUnsafe<VersaoComercial[]>(
    `SELECT id,
            regra_comercial_id AS "regraComercialId",
            competencia,
            cartao_acesso_saude AS "cartaoAcessoSaude",
            cire_ativo AS "cireAtivo",
            cire_receptivo AS "cireReceptivo",
            franchising_acesso AS "franchisingAcesso",
            franchising_cartao AS "franchisingCartao",
            unidade
       FROM regras_comerciais_versoes
      WHERE regra_comercial_id = $1::uuid
        AND competencia = $2
      LIMIT 1`,
    regraComercialId,
    competencia,
  );
  return rows[0] ?? null;
}

export async function salvarVersaoComercial(params: {
  regraComercialId: string;
  competencia: string;
  valores: Record<string, number>;
}) {
  const { regraComercialId, competencia, valores } = params;
  const delegate = (prisma as any).regraComercialVersao;
  const data = Object.fromEntries(
    camposComerciais.map((campo) => {
      const nomeCampo = campo.replace(/_([a-z])/g, (_, letra) => letra.toUpperCase());
      return [nomeCampo, valores[nomeCampo] ?? valores[campo] ?? 0];
    }),
  );

  if (delegate?.upsert) {
    return delegate.upsert({
      where: {
        regraComercialId_competencia: { regraComercialId, competencia },
      },
      create: { regraComercialId, competencia, ...data },
      update: data,
    });
  }

  return prisma.$executeRawUnsafe(
    `INSERT INTO regras_comerciais_versoes
      (id, regra_comercial_id, competencia, cartao_acesso_saude,
       cire_ativo, cire_receptivo, franchising_acesso,
       franchising_cartao, unidade)
     VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (regra_comercial_id, competencia)
     DO UPDATE SET cartao_acesso_saude = EXCLUDED.cartao_acesso_saude,
                   cire_ativo = EXCLUDED.cire_ativo,
                   cire_receptivo = EXCLUDED.cire_receptivo,
                   franchising_acesso = EXCLUDED.franchising_acesso,
                   franchising_cartao = EXCLUDED.franchising_cartao,
                   unidade = EXCLUDED.unidade`,
    regraComercialId,
    competencia,
    data.cartaoAcessoSaude,
    data.cireAtivo,
    data.cireReceptivo,
    data.franchisingAcesso,
    data.franchisingCartao,
    data.unidade,
  );
}

export type VersaoGestor = {
  id: string;
  regraGestorId: string;
  competencia: string;
  gerenteCire: number;
  supervisorAtivo: number;
  supervisorReceptivo: number;
  supervisorFranquia: number;
  supervisorAtendimento: number;
  gerenteAtendimento: number;
  supervisorComercial: number;
};

const camposGestores = [
  "gerente_cire",
  "supervisor_ativo",
  "supervisor_receptivo",
  "supervisor_franquia",
  "supervisor_atendimento",
  "gerente_atendimento",
  "supervisor_comercial",
] as const;

export async function buscarVersaoGestor(
  regraGestorId: string,
  competencia: string,
): Promise<VersaoGestor | null> {
  const delegate = (prisma as any).regraGestorVersao;
  if (delegate?.findUnique) {
    return delegate.findUnique({
      where: { regraGestorId_competencia: { regraGestorId, competencia } },
    });
  }

  const rows = await prisma.$queryRawUnsafe<VersaoGestor[]>(
    `SELECT id,
            regra_gestor_id AS "regraGestorId",
            competencia,
            gerente_cire AS "gerenteCire",
            supervisor_ativo AS "supervisorAtivo",
            supervisor_receptivo AS "supervisorReceptivo",
            supervisor_franquia AS "supervisorFranquia",
            supervisor_atendimento AS "supervisorAtendimento",
            gerente_atendimento AS "gerenteAtendimento",
            supervisor_comercial AS "supervisorComercial"
       FROM regras_gestores_versoes
      WHERE regra_gestor_id = $1::uuid
        AND competencia = $2
      LIMIT 1`,
    regraGestorId,
    competencia,
  );
  return rows[0] ?? null;
}

export async function salvarVersaoGestor(params: {
  regraGestorId: string;
  competencia: string;
  valores: Record<string, number>;
}) {
  const { regraGestorId, competencia, valores } = params;
  const delegate = (prisma as any).regraGestorVersao;
  const data = Object.fromEntries(
    camposGestores.map((campo) => {
      const nomeCampo = campo.replace(/_([a-z])/g, (_, letra) => letra.toUpperCase());
      return [nomeCampo, valores[nomeCampo] ?? valores[campo] ?? 0];
    }),
  );

  if (delegate?.upsert) {
    return delegate.upsert({
      where: { regraGestorId_competencia: { regraGestorId, competencia } },
      create: { regraGestorId, competencia, ...data },
      update: data,
    });
  }

  return prisma.$executeRawUnsafe(
    `INSERT INTO regras_gestores_versoes
      (id, regra_gestor_id, competencia, gerente_cire, supervisor_ativo,
       supervisor_receptivo, supervisor_franquia, supervisor_atendimento,
       gerente_atendimento, supervisor_comercial)
     VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (regra_gestor_id, competencia)
     DO UPDATE SET gerente_cire = EXCLUDED.gerente_cire,
                   supervisor_ativo = EXCLUDED.supervisor_ativo,
                   supervisor_receptivo = EXCLUDED.supervisor_receptivo,
                   supervisor_franquia = EXCLUDED.supervisor_franquia,
                   supervisor_atendimento = EXCLUDED.supervisor_atendimento,
                   gerente_atendimento = EXCLUDED.gerente_atendimento,
                   supervisor_comercial = EXCLUDED.supervisor_comercial`,
    regraGestorId,
    competencia,
    data.gerenteCire,
    data.supervisorAtivo,
    data.supervisorReceptivo,
    data.supervisorFranquia,
    data.supervisorAtendimento,
    data.gerenteAtendimento,
    data.supervisorComercial,
  );
}
