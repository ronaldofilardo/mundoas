-- Seed de usuários padrão para ambiente de dev/qa
-- Banco: asa_db
-- Execute: psql -U postgres -d asa_db -h localhost -f packages/database/sql/seed_usuarios_padrao.sql
-- Senha de todos: 123456

-- ============================================================
-- 0. Garantir que existe o valor 'GESTOR_PJ' no enum TipoUsuario
-- ============================================================
DO $$ BEGIN
  ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'GESTOR_PJ';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- 1. ADMIN: admin@asa.com / 123456
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, telefone, status, senha_temporaria, papel, criado_em, atualizado_em)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Administrador',
  'admin@asa.com',
  '$2a$12$ljxPs3gnD.X1ZSIgBv3U7eHIl.zz0G28DAQduiOLlUSdiHQ2fuih',
  'ADMIN',
  '(11) 99999-0001',
  'ATIVO',
  false,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  senha_hash = EXCLUDED.senha_hash,
  tipo = 'ADMIN',
  papel = NULL,
  status = 'ATIVO',
  senha_temporaria = false,
  atualizado_em = NOW();

-- ============================================================
-- 2. BackOffice: back@asa.com / 123456 — cpf 12345678901 papel/role: BackOffice
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, papel, telefone, status, senha_temporaria, criado_em, atualizado_em)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'BackOffice',
  'back@asa.com',
  '$2a$10$u8OQgliT6HXdJcRNAw6F..pupcZ0t5gKNnP.cv08UiigHi2enKBiO',
  'BACKOFFICE',
  'BACKOFFICE',
  '(11) 99999-0002',
  'ATIVO',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  senha_hash = EXCLUDED.senha_hash,
  tipo = 'BACKOFFICE',
  papel = 'BACKOFFICE',
  status = 'ATIVO',
  senha_temporaria = false,
  atualizado_em = NOW();

INSERT INTO backoffices (id, usuario_id, nome, cpf, percentual_comissao_default, percentual_comissao_max, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222223',
  '22222222-2222-2222-2222-222222222222',
  'BackOffice',
  '12345678901',
  5.00,
  100.00,
  NOW(),
  NOW()
)
ON CONFLICT (cpf) DO UPDATE SET
  nome = EXCLUDED.nome,
  usuario_id = EXCLUDED.usuario_id,
  updated_at = NOW();

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT 'Usuários padrão semeados com sucesso!' AS status;
SELECT email, tipo, papel, status
FROM usuarios
WHERE email IN ('admin@asa.com', 'back@asa.com')
ORDER BY email;
