-- Seed de usuários padrão para ambiente de produção
-- Execute: psql -U postgres -d asa_db -h localhost -f packages/database/sql/seed_usuarios_default.sql
-- senha padrão: 123456

-- ============================================================
-- 1. ADMIN
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, telefone, status, senha_temporaria, papel, criado_em, atualizado_em)
VALUES (
  '00000000-0000-0000-0001-000000000001',
  'Administrador',
  'admin@asa.com',
  '$2a$12$uF0dL8sTPbckvCzvlvgK0uDoK3dm/wEufvO0Xfn1MNiI4T.6Nknni',
  'ADMIN',
  '(11) 99999-0000',
  'ATIVO',
  false,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  senha_hash = EXCLUDED.senha_hash,
  tipo = 'ADMIN',
  papel = NULL,
  senha_temporaria = false,
  atualizado_em = NOW();

-- ============================================================
-- 2. BackOffice (tipo BACKOFFICE, papel BACKOFFICE)
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, papel, telefone, status, senha_temporaria, criado_em, atualizado_em)
VALUES (
  '00000000-0000-0000-0002-000000000001',
  'BackOffice Admin',
  'back@asa.com',
  '$2a$12$uF0dL8sTPbckvCzvlvgK0uDoK3dm/wEufvO0Xfn1MNiI4T.6Nknni',
  'BACKOFFICE',
  'BACKOFFICE',
  NULL,
  'ATIVO',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  senha_hash = EXCLUDED.senha_hash,
  tipo = 'BACKOFFICE',
  papel = 'BACKOFFICE',
  senha_temporaria = false,
  atualizado_em = NOW();

INSERT INTO backoffices (id, usuario_id, nome, cpf, percentual_comissao_default, percentual_comissao_max, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0002-000000000002',
  '00000000-0000-0000-0002-000000000001',
  'BackOffice Admin',
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
-- VERIFICACAO
-- ============================================================
SELECT 'Usuarios seed executado com sucesso!' AS status;
SELECT id, nome, email, tipo, papel FROM usuarios ORDER BY email;
SELECT id, nome, cpf, percentual_comissao_default FROM backoffices WHERE cpf = '12345678901';

-- ============================================================
-- NOTA: Usuarios do sistema PJ (consultor, gestor-pj, estabelecimentos,
--       cupons) foram removidos em PLANO_REMOCAO_SISTEMA_PJ.
-- ============================================================
