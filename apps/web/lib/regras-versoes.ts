import { prisma } from "@asa/database";

export type VersaoComercial = {
  id: string;
  regraComercialId: string;
  competencia: string;
};

export async function buscarVersaoComercial(
  regraComercialId: string,
  competencia: string,
): Promise<VersaoComercial | null> {
  const rows = await prisma.$queryRawUnsafe<VersaoComercial[]>(
    `SELECT id,
            regra_comercial_id AS "regraComercialId",
            competencia
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
  const { regraComercialId, competencia } = params;
  return prisma.$executeRawUnsafe(
    `INSERT INTO regras_comerciais_versoes (id, regra_comercial_id, competencia)
     VALUES (gen_random_uuid(), $1::uuid, $2)
     ON CONFLICT (regra_comercial_id, competencia) DO NOTHING`,
    regraComercialId,
    competencia,
  );
}

export type VersaoGestor = {
  id: string;
  regraGestorId: string;
  competencia: string;
};

export async function buscarVersaoGestor(
  regraGestorId: string,
  competencia: string,
): Promise<VersaoGestor | null> {
  const rows = await prisma.$queryRawUnsafe<VersaoGestor[]>(
    `SELECT id,
            regra_gestor_id AS "regraGestorId",
            competencia
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
  const { regraGestorId, competencia } = params;
  return prisma.$executeRawUnsafe(
    `INSERT INTO regras_gestores_versoes (id, regra_gestor_id, competencia)
     VALUES (gen_random_uuid(), $1::uuid, $2)
     ON CONFLICT (regra_gestor_id, competencia) DO NOTHING`,
    regraGestorId,
    competencia,
  );
}
