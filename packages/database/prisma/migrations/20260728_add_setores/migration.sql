CREATE TABLE "setores" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" VARCHAR(255),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "setores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "setores_nome_key" ON "setores"("nome");

CREATE TABLE "consultor_pf_setores" (
    "id" UUID NOT NULL,
    "consultor_pf_id" UUID NOT NULL,
    "setor_id" UUID NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultor_pf_setores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "consultor_pf_setores_consultor_pf_id_setor_id_key" ON "consultor_pf_setores"("consultor_pf_id", "setor_id");

CREATE INDEX "consultor_pf_setores_consultor_pf_id_idx" ON "consultor_pf_setores"("consultor_pf_id");

CREATE INDEX "consultor_pf_setores_setor_id_idx" ON "consultor_pf_setores"("setor_id");

INSERT INTO "setores" ("id", "nome", "descricao") VALUES
    (gen_random_uuid(), 'Cire Receptivo', 'Callcenter receptivo'),
    (gen_random_uuid(), 'Cire Ativo', 'Callcenter ativo'),
    (gen_random_uuid(), 'BSF Cartão', 'BSF Cartão Acesso Saúde'),
    (gen_random_uuid(), 'BSF Clínica', 'BSF Clínica'),
    (gen_random_uuid(), 'BSF Odontologia', 'BSF Odontologia'),
    (gen_random_uuid(), 'Shop Sorriso', 'Shop Sorriso'),
    (gen_random_uuid(), 'Unidade Curitiba', 'Unidade Curitiba'),
    (gen_random_uuid(), 'Unidade Colombo', 'Unidade Colombo')
ON CONFLICT ("nome") DO NOTHING;
