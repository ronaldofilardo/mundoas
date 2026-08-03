-- Garante os 6 setores esperados pelo cadastro de Consultor PF pela Liderança.
-- Idempotente: insere os ausentes, renomeia variações antigas quando possível.

-- 1) Inserir setores faltantes (caso ainda não existam pelo nome)
INSERT INTO "setores" ("id", "nome", "descricao") VALUES
    (gen_random_uuid(), 'Cartão Acesso Saúde', 'Setor Cartão Acesso Saúde'),
    (gen_random_uuid(), 'CIRE Ativo',          'Setor CIRE Ativo'),
    (gen_random_uuid(), 'CIRE Receptivo',      'Setor CIRE Receptivo'),
    (gen_random_uuid(), 'Franchising Acesso',  'Setor Franchising Acesso'),
    (gen_random_uuid(), 'Franchising Cartão',  'Setor Franchising Cartão'),
    (gen_random_uuid(), 'Unidade',             'Setor Unidade')
ON CONFLICT ("backoffice_id", "nome") DO NOTHING;

-- 2) Normalizar nomes antigos para os 6 canônicos.
--    "BSF Cartão" / "BSF Clínica" / "BSF Odontologia" / "Shop Sorriso" / "Unidade Curitiba" / "Unidade Colombo"
--    foram criados pela migration 20260728_add_setores mas não fazem parte da lista atual.
--    Mantemos como 'inativo' para não quebrar dados históricos (FKs ON DELETE CASCADE).
UPDATE "setores" SET "ativo" = false WHERE "nome" IN (
    'BSF Cartão',
    'BSF Clínica',
    'BSF Odontologia',
    'Shop Sorriso',
    'Unidade Curitiba',
    'Unidade Colombo'
) AND "ativo" = true;
