-- Fase 1a: copiar valores legados (> 0) das colunas Decimal de regras_comerciais/gestores/faltas
-- para as tabelas de itens como CUSTOM. Idempotente: só insere onde ainda não existe
-- um item com mesmo (regra_id, nome).

-- =========================================================
-- Regras Comerciais
-- =========================================================
INSERT INTO regras_comerciais_itens (id, regra_comercial_id, nome, percentual, tipo, ordem, created_at, updated_at)
SELECT gen_random_uuid(), rc.id, v.nome, v.percentual, 'CUSTOM'::"RegraItemTipo", v.ordem, NOW(), NOW()
FROM regras_comerciais rc
CROSS JOIN LATERAL (
  VALUES
    ('cartaoAcessoSaude', rc.cartao_acesso_saude, 0),
    ('cireAtivo',         rc.cire_ativo,         1),
    ('cireReceptivo',     rc.cire_receptivo,     2),
    ('franchisingAcesso', rc.franchising_acesso, 3),
    ('franchisingCartao', rc.franchising_cartao, 4),
    ('unidade',           rc.unidade,            5)
) AS v(nome, percentual, ordem)
WHERE v.percentual > 0
  AND NOT EXISTS (
    SELECT 1 FROM regras_comerciais_itens i
    WHERE i.regra_comercial_id = rc.id AND i.nome = v.nome
  );

-- =========================================================
-- Regras Gestores
-- =========================================================
INSERT INTO regras_gestores_itens (id, regra_gestor_id, nome, percentual, tipo, ordem, created_at, updated_at)
SELECT gen_random_uuid(), rg.id, v.nome, v.percentual, 'CUSTOM'::"RegraItemTipo", v.ordem, NOW(), NOW()
FROM regras_gestores rg
CROSS JOIN LATERAL (
  VALUES
    ('gerenteCire',           rg.gerente_cire,           0),
    ('supervisorAtivo',       rg.supervisor_ativo,       1),
    ('supervisorReceptivo',   rg.supervisor_receptivo,   2),
    ('supervisorFranquia',    rg.supervisor_franquia,    3),
    ('supervisorAtendimento', rg.supervisor_atendimento, 4),
    ('gerenteAtendimento',    rg.gerente_atendimento,    5),
    ('supervisorComercial',   rg.supervisor_comercial,   6)
) AS v(nome, percentual, ordem)
WHERE v.percentual > 0
  AND NOT EXISTS (
    SELECT 1 FROM regras_gestores_itens i
    WHERE i.regra_gestor_id = rg.id AND i.nome = v.nome
  );

-- =========================================================
-- Regras Faltas
-- =========================================================
INSERT INTO regras_faltas_itens (id, regra_falta_id, nome, percentual, tipo, ordem, created_at, updated_at)
SELECT gen_random_uuid(), rf.id, v.nome, v.percentual, 'CUSTOM'::"RegraItemTipo", v.ordem, NOW(), NOW()
FROM regras_faltas rf
CROSS JOIN LATERAL (
  VALUES
    ('consultorUnidadeComFalta',      rf.consultor_unidade_com_falta,      0),
    ('consultorUnidadeSemFalta',      rf.consultor_unidade_sem_falta,      1),
    ('supervisorAtendimentoComFalta', rf.supervisor_atendimento_com_falta, 2),
    ('supervisorAtendimentoSemFalta', rf.supervisor_atendimento_sem_falta, 3),
    ('gerenteComercialComFalta',      rf.gerente_comercial_com_falta,      4),
    ('gerenteComercialSemFalta',      rf.gerente_comercial_sem_falta,      5)
) AS v(nome, percentual, ordem)
WHERE v.percentual > 0
  AND NOT EXISTS (
    SELECT 1 FROM regras_faltas_itens i
    WHERE i.regra_falta_id = rf.id AND i.nome = v.nome
  );
