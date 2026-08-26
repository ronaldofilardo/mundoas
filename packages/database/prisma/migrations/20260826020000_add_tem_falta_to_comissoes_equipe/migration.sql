-- Align ComissaoEquipe with the Prisma contract used by absence rules.
-- Existing commissions default to no absence.

ALTER TABLE "comissoes_equipe"
  ADD COLUMN IF NOT EXISTS "tem_falta" BOOLEAN NOT NULL DEFAULT false;
