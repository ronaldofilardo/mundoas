--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: FuncaoComercial; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FuncaoComercial" AS ENUM (
    'GERENTE_CIRE',
    'SUPERVISOR_ATIVO',
    'SUPERVISOR_RECEPTIVO',
    'SUPERVISOR_FRANQUIA',
    'SUPERVISOR_ATENDIMENTO',
    'GERENTE_ATENDIMENTO',
    'SUPERVISOR_COMERCIAL'
);


ALTER TYPE public."FuncaoComercial" OWNER TO postgres;

--
-- Name: OrigemMovimentacaoPontos; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrigemMovimentacaoPontos" AS ENUM (
    'PRODUCAO_IMPORTADA',
    'RESGATE',
    'ESTORNO_RESGATE',
    'EXPIRACAO',
    'AJUSTE_MANUAL'
);


ALTER TYPE public."OrigemMovimentacaoPontos" OWNER TO postgres;

--
-- Name: PapelGestor; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PapelGestor" AS ENUM (
    'GESTOR_PJ',
    'BACKOFFICE'
);


ALTER TYPE public."PapelGestor" OWNER TO postgres;

--
-- Name: PeriodicidadeCiclo; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PeriodicidadeCiclo" AS ENUM (
    'SEMESTRAL',
    'ANUAL'
);


ALTER TYPE public."PeriodicidadeCiclo" OWNER TO postgres;

--
-- Name: StatusCicloPontos; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusCicloPontos" AS ENUM (
    'EM_ANDAMENTO',
    'RESGATE_ABERTO',
    'ENCERRADO'
);


ALTER TYPE public."StatusCicloPontos" OWNER TO postgres;

--
-- Name: StatusComissao; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusComissao" AS ENUM (
    'PENDENTE',
    'CALCULADA',
    'PAGA'
);


ALTER TYPE public."StatusComissao" OWNER TO postgres;

--
-- Name: StatusConsulta; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusConsulta" AS ENUM (
    'AGENDADA',
    'REALIZADA',
    'CANCELADA',
    'NAO_COMPARECEU'
);


ALTER TYPE public."StatusConsulta" OWNER TO postgres;

--
-- Name: StatusCupom; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusCupom" AS ENUM (
    'ATIVO',
    'INATIVO'
);


ALTER TYPE public."StatusCupom" OWNER TO postgres;

--
-- Name: StatusCupomImportado; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusCupomImportado" AS ENUM (
    'DISPONIVEL',
    'USADO',
    'CANCELADO',
    'EXPIRADO'
);


ALTER TYPE public."StatusCupomImportado" OWNER TO postgres;

--
-- Name: StatusIndicado; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusIndicado" AS ENUM (
    'ATIVO',
    'DESVINCULADO'
);


ALTER TYPE public."StatusIndicado" OWNER TO postgres;

--
-- Name: StatusParceiro; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusParceiro" AS ENUM (
    'ATIVO',
    'DESLIGADO'
);


ALTER TYPE public."StatusParceiro" OWNER TO postgres;

--
-- Name: StatusProcedimento; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusProcedimento" AS ENUM (
    'PENDENTE',
    'CALCULADA',
    'PAGA'
);


ALTER TYPE public."StatusProcedimento" OWNER TO postgres;

--
-- Name: StatusSolicitacaoResgate; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusSolicitacaoResgate" AS ENUM (
    'SOLICITADO',
    'EM_ANALISE',
    'APROVADO',
    'REJEITADO',
    'ENTREGUE',
    'CANCELADO'
);


ALTER TYPE public."StatusSolicitacaoResgate" OWNER TO postgres;

--
-- Name: StatusUpload; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusUpload" AS ENUM (
    'PROCESSANDO',
    'CONCLUIDO',
    'ERRO'
);


ALTER TYPE public."StatusUpload" OWNER TO postgres;

--
-- Name: StatusUsuario; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusUsuario" AS ENUM (
    'ATIVO',
    'INATIVO'
);


ALTER TYPE public."StatusUsuario" OWNER TO postgres;

--
-- Name: TipoAcessoEstabelecimento; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoAcessoEstabelecimento" AS ENUM (
    'PROPRIETARIO',
    'VISUALIZADOR'
);


ALTER TYPE public."TipoAcessoEstabelecimento" OWNER TO postgres;

--
-- Name: TipoArredondamento; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoArredondamento" AS ENUM (
    'PISO',
    'TETO',
    'PADRAO'
);


ALTER TYPE public."TipoArredondamento" OWNER TO postgres;

--
-- Name: TipoDocumento; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoDocumento" AS ENUM (
    'CNPJ',
    'CPF_RESPONSAVEL'
);


ALTER TYPE public."TipoDocumento" OWNER TO postgres;

--
-- Name: TipoLideranca; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoLideranca" AS ENUM (
    'COMERCIAL',
    'GESTOR'
);


ALTER TYPE public."TipoLideranca" OWNER TO postgres;

--
-- Name: TipoMovimentacaoPontos; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoMovimentacaoPontos" AS ENUM (
    'CREDITO',
    'DEBITO',
    'ESTORNO'
);


ALTER TYPE public."TipoMovimentacaoPontos" OWNER TO postgres;

--
-- Name: TipoPix; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoPix" AS ENUM (
    'CPF',
    'CNPJ',
    'EMAIL',
    'TELEFONE'
);


ALTER TYPE public."TipoPix" OWNER TO postgres;

--
-- Name: TipoUsuario; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoUsuario" AS ENUM (
    'GESTOR',
    'CONSULTOR',
    'ADMIN',
    'PARCEIRO',
    'COMERCIAL',
    'LIDERANCA',
    'BACKOFFICE',
    'SUPERVISAO',
    'GERENCIA',
    'GESTOR_PJ'
);


ALTER TYPE public."TipoUsuario" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    usuario_id uuid,
    acao character varying(100) NOT NULL,
    entidade character varying(100) NOT NULL,
    entidade_id uuid,
    detalhes jsonb,
    criado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: backoffices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.backoffices (
    id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    cpf character varying(14) NOT NULL,
    percentual_comissao_default numeric(5,2) DEFAULT 5.00 NOT NULL,
    percentual_comissao_max numeric(5,2) DEFAULT 100.00 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.backoffices OWNER TO postgres;

--
-- Name: base_clientes_acesso_saude; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.base_clientes_acesso_saude (
    cpf character varying(11) NOT NULL
);


ALTER TABLE public.base_clientes_acesso_saude OWNER TO postgres;

--
-- Name: ciclos_pontos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ciclos_pontos (
    id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    inicio_acumulo_em timestamp(3) without time zone NOT NULL,
    fim_acumulo_em timestamp(3) without time zone NOT NULL,
    fim_resgate_em timestamp(3) without time zone NOT NULL,
    status public."StatusCicloPontos" DEFAULT 'EM_ANDAMENTO'::public."StatusCicloPontos" NOT NULL,
    processado_expiracao_em timestamp(3) without time zone,
    criado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em timestamp(3) without time zone NOT NULL,
    periodicidade public."PeriodicidadeCiclo" DEFAULT 'ANUAL'::public."PeriodicidadeCiclo" NOT NULL,
    backoffice_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL
);


ALTER TABLE public.ciclos_pontos OWNER TO postgres;

--
-- Name: comerciais; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comerciais (
    id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    cpf character varying(14) NOT NULL,
    percentual_comissao numeric(5,2) DEFAULT 0 NOT NULL,
    status public."StatusUsuario" DEFAULT 'ATIVO'::public."StatusUsuario" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    funcao public."FuncaoComercial",
    lideranca_id uuid NOT NULL,
    "tipoLideranca" public."TipoLideranca",
    tipo character varying(50)
);


ALTER TABLE public.comerciais OWNER TO postgres;

--
-- Name: comissoes_comerciais; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comissoes_comerciais (
    id uuid NOT NULL,
    comercial_id uuid NOT NULL,
    mes_referencia text NOT NULL,
    valor_vendas numeric(12,2) DEFAULT 0 NOT NULL,
    valor_comissao numeric(12,2) DEFAULT 0 NOT NULL,
    status public."StatusComissao" DEFAULT 'CALCULADA'::public."StatusComissao" NOT NULL,
    data_pagamento timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.comissoes_comerciais OWNER TO postgres;

--
-- Name: configuracoes_pontos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configuracoes_pontos (
    id uuid NOT NULL,
    valor_por_ponto numeric(10,2) NOT NULL,
    tipo_arredondamento public."TipoArredondamento" DEFAULT 'PADRAO'::public."TipoArredondamento" NOT NULL,
    vigente_desde timestamp(3) without time zone NOT NULL,
    vigente_ate timestamp(3) without time zone,
    criado_por uuid,
    criado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em timestamp(3) without time zone NOT NULL,
    backoffice_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL
);


ALTER TABLE public.configuracoes_pontos OWNER TO postgres;

--
-- Name: consultas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultas (
    id uuid NOT NULL,
    cupom_importado_id uuid NOT NULL,
    data_agendamento timestamp(3) without time zone,
    data_realizacao timestamp(3) without time zone,
    status public."StatusConsulta" NOT NULL,
    valor_pago numeric(10,2),
    criado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.consultas OWNER TO postgres;

--
-- Name: consultores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultores (
    id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    pix_chave character varying(100),
    pix_tipo public."TipoPix",
    banco_nome character varying(100),
    agencia character varying(10),
    conta character varying(20),
    total_consultas integer DEFAULT 0 NOT NULL,
    criado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    cpf character varying(14)
);


ALTER TABLE public.consultores OWNER TO postgres;

--
-- Name: cupons_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cupons_config (
    id uuid NOT NULL,
    estabelecimento_id uuid NOT NULL,
    codigo_cupom character varying(50) NOT NULL,
    descricao character varying(255),
    status public."StatusCupom" DEFAULT 'ATIVO'::public."StatusCupom" NOT NULL,
    criado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    criado_por uuid NOT NULL
);


ALTER TABLE public.cupons_config OWNER TO postgres;

--
-- Name: cupons_importados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cupons_importados (
    id uuid NOT NULL,
    cupom_config_id uuid NOT NULL,
    paciente_nome character varying(255) NOT NULL,
    paciente_cpf character varying(14),
    campanha character varying(100) DEFAULT 'Acesso Saude Aqui'::character varying NOT NULL,
    servico character varying(50) DEFAULT 'Cupom'::character varying NOT NULL,
    preco_original numeric(10,2) NOT NULL,
    desconto_percentual numeric(5,2) DEFAULT 10.00 NOT NULL,
    preco_final numeric(10,2) NOT NULL,
    status public."StatusCupomImportado" DEFAULT 'DISPONIVEL'::public."StatusCupomImportado" NOT NULL,
    consulta_id uuid,
    usado_em timestamp(3) without time zone,
    mes_referencia integer NOT NULL,
    ano_referencia integer NOT NULL,
    criado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.cupons_importados OWNER TO postgres;

--
-- Name: documentos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documentos (
    id uuid NOT NULL,
    estabelecimento_id uuid NOT NULL,
    tipo public."TipoDocumento" NOT NULL,
    url_arquivo text NOT NULL,
    nome_original character varying(255),
    tamanho_bytes integer,
    mimetype character varying(100),
    criado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.documentos OWNER TO postgres;

--
-- Name: estabelecimentos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.estabelecimentos (
    id uuid NOT NULL,
    consultor_id uuid NOT NULL,
    nome_fantasia character varying(255) NOT NULL,
    razao_social character varying(255),
    cnpj character varying(20),
    endereco text,
    cidade character varying(100),
    estado character varying(2),
    telefone character varying(20),
    email character varying(255),
    responsavel_nome character varying(255),
    responsavel_cpf character varying(14),
    status public."StatusUsuario" DEFAULT 'ATIVO'::public."StatusUsuario" NOT NULL,
    criado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    pix_chave character varying(100),
    banco_nome character varying(100),
    agencia character varying(10),
    conta character varying(20),
    pix_tipo public."TipoPix"
);


ALTER TABLE public.estabelecimentos OWNER TO postgres;

--
-- Name: gestores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gestores (
    id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    cpf character varying(14) NOT NULL,
    lideranca_id uuid NOT NULL,
    percentual_comissao numeric(5,2) DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    status public."StatusUsuario" DEFAULT 'ATIVO'::public."StatusUsuario" NOT NULL
);


ALTER TABLE public.gestores OWNER TO postgres;

--
-- Name: gestores_consultores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gestores_consultores (
    id uuid NOT NULL,
    gestor_id uuid NOT NULL,
    consultor_id uuid NOT NULL,
    atribuido_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.gestores_consultores OWNER TO postgres;

--
-- Name: indicados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.indicados (
    id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    cpf character varying(14) NOT NULL,
    telefone character varying(20),
    status public."StatusIndicado" DEFAULT 'ATIVO'::public."StatusIndicado" NOT NULL,
    parceiro_id uuid NOT NULL,
    desvinculado_em timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.indicados OWNER TO postgres;

--
-- Name: liderancas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.liderancas (
    id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    cpf character varying(14) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    tipo public."TipoLideranca" NOT NULL,
    status public."StatusUsuario" DEFAULT 'ATIVO'::public."StatusUsuario" NOT NULL,
    backoffice_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL
);


ALTER TABLE public.liderancas OWNER TO postgres;

--
-- Name: metas_comerciais; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metas_comerciais (
    id uuid NOT NULL,
    comercial_id uuid NOT NULL,
    mes_referencia text NOT NULL,
    valor_meta numeric(12,2) DEFAULT 0 NOT NULL,
    valor_atingido numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.metas_comerciais OWNER TO postgres;

--
-- Name: movimentacoes_pontos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimentacoes_pontos (
    id uuid NOT NULL,
    parceiro_id uuid NOT NULL,
    ciclo_pontos_id uuid NOT NULL,
    tipo public."TipoMovimentacaoPontos" NOT NULL,
    origem public."OrigemMovimentacaoPontos" NOT NULL,
    quantidade integer NOT NULL,
    referencia_procedimento_id uuid,
    referencia_solicitacao_resgate_id uuid,
    configuracao_pontos_id uuid,
    observacao text,
    criado_por uuid,
    criado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    descricao text
);


ALTER TABLE public.movimentacoes_pontos OWNER TO postgres;

--
-- Name: parceiros; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parceiros (
    id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    cpf character varying(14) NOT NULL,
    pix_chave character varying(100),
    status public."StatusParceiro" DEFAULT 'ATIVO'::public."StatusParceiro" NOT NULL,
    desligado_em timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    periodicidade_ciclo_escolhida public."PeriodicidadeCiclo",
    comercial_id uuid,
    gestor_id uuid
);


ALTER TABLE public.parceiros OWNER TO postgres;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id uuid NOT NULL,
    usuario_id uuid,
    usuario_estabelecimento_id uuid,
    token character varying(255) NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    criado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: premios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.premios (
    id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    descricao text NOT NULL,
    custo_pontos integer NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    imagem_url text,
    criado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em timestamp(3) without time zone NOT NULL,
    backoffice_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL
);


ALTER TABLE public.premios OWNER TO postgres;

--
-- Name: primeira_acss; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.primeira_acss (
    id uuid NOT NULL,
    token text NOT NULL,
    parceiro_id uuid,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.primeira_acss OWNER TO postgres;

--
-- Name: procedimentos_pf; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.procedimentos_pf (
    id uuid NOT NULL,
    data_referencia timestamp(3) without time zone NOT NULL,
    data_pagamento timestamp(3) without time zone NOT NULL,
    forma_pagamento character varying(50) NOT NULL,
    total_pago numeric(10,2) NOT NULL,
    paciente character varying(255) NOT NULL,
    procedimento character varying(255) NOT NULL,
    cpf character varying(14) NOT NULL,
    tipo_procedimento character varying(50) NOT NULL,
    unidade character varying(100) NOT NULL,
    indicado_id uuid,
    parceiro_id uuid,
    upload_id uuid NOT NULL,
    valor_comissao numeric(10,2) DEFAULT 0 NOT NULL,
    status_comissao public."StatusProcedimento" DEFAULT 'PENDENTE'::public."StatusProcedimento" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    comercial_id uuid,
    gestor_id uuid
);


ALTER TABLE public.procedimentos_pf OWNER TO postgres;

--
-- Name: ranking_posicoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ranking_posicoes (
    id uuid NOT NULL,
    ranking_snapshot_id uuid NOT NULL,
    parceiro_id uuid NOT NULL,
    posicao integer NOT NULL,
    pontos_acumulados integer NOT NULL
);


ALTER TABLE public.ranking_posicoes OWNER TO postgres;

--
-- Name: ranking_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ranking_snapshots (
    id uuid NOT NULL,
    ciclo_pontos_id uuid NOT NULL,
    referencia_mes character varying(7) NOT NULL,
    gerado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ranking_snapshots OWNER TO postgres;

--
-- Name: regras_comerciais; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.regras_comerciais (
    id uuid NOT NULL,
    cartao_acesso_saude numeric(5,2) DEFAULT 0 NOT NULL,
    cire_ativo numeric(5,2) DEFAULT 0 NOT NULL,
    cire_receptivo numeric(5,2) DEFAULT 0 NOT NULL,
    franchising_acesso numeric(5,2) DEFAULT 0 NOT NULL,
    franchising_cartao numeric(5,2) DEFAULT 0 NOT NULL,
    unidade numeric(5,2) DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    backoffice_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL
);


ALTER TABLE public.regras_comerciais OWNER TO postgres;

--
-- Name: regras_gestores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.regras_gestores (
    id uuid NOT NULL,
    gerente_cire numeric(5,2) DEFAULT 0 NOT NULL,
    supervisor_ativo numeric(5,2) DEFAULT 0 NOT NULL,
    supervisor_receptivo numeric(5,2) DEFAULT 0 NOT NULL,
    supervisor_franquia numeric(5,2) DEFAULT 0 NOT NULL,
    supervisor_atendimento numeric(5,2) DEFAULT 0 NOT NULL,
    gerente_atendimento numeric(5,2) DEFAULT 0 NOT NULL,
    supervisor_comercial numeric(5,2) DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    backoffice_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL
);


ALTER TABLE public.regras_gestores OWNER TO postgres;

--
-- Name: solicitacoes_resgate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitacoes_resgate (
    id uuid NOT NULL,
    parceiro_id uuid NOT NULL,
    premio_id uuid NOT NULL,
    ciclo_pontos_id uuid NOT NULL,
    pontos_debitados integer NOT NULL,
    status public."StatusSolicitacaoResgate" DEFAULT 'SOLICITADO'::public."StatusSolicitacaoResgate" NOT NULL,
    solicitado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processado_por uuid,
    processado_em timestamp(3) without time zone,
    entregue_em timestamp(3) without time zone,
    cancelado_em timestamp(3) without time zone,
    observacao text
);


ALTER TABLE public.solicitacoes_resgate OWNER TO postgres;

--
-- Name: uploads_planilha_backoffice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.uploads_planilha_backoffice (
    id uuid NOT NULL,
    "nomeArquivo" character varying(255) NOT NULL,
    mes_referencia text NOT NULL,
    status public."StatusUpload" DEFAULT 'PROCESSANDO'::public."StatusUpload" NOT NULL,
    total_rows integer DEFAULT 0 NOT NULL,
    processed_rows integer DEFAULT 0 NOT NULL,
    rejected_rows integer DEFAULT 0 NOT NULL,
    orphaned_rows integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    backoffice_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL
);


ALTER TABLE public.uploads_planilha_backoffice OWNER TO postgres;

--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    senha_hash character varying(255) NOT NULL,
    tipo public."TipoUsuario" NOT NULL,
    telefone character varying(20),
    status public."StatusUsuario" DEFAULT 'ATIVO'::public."StatusUsuario" NOT NULL,
    criado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    senha_temporaria boolean DEFAULT true NOT NULL,
    papel public."PapelGestor"
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: usuarios_estabelecimentos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios_estabelecimentos (
    id uuid NOT NULL,
    estabelecimento_id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    senha_hash character varying(255) NOT NULL,
    tipo public."TipoAcessoEstabelecimento" DEFAULT 'PROPRIETARIO'::public."TipoAcessoEstabelecimento" NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    criado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    senha_temporaria boolean DEFAULT true NOT NULL
);


ALTER TABLE public.usuarios_estabelecimentos OWNER TO postgres;

--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: backoffices backoffices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backoffices
    ADD CONSTRAINT backoffices_pkey PRIMARY KEY (id);


--
-- Name: base_clientes_acesso_saude base_clientes_acesso_saude_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.base_clientes_acesso_saude
    ADD CONSTRAINT base_clientes_acesso_saude_pkey PRIMARY KEY (cpf);


--
-- Name: ciclos_pontos ciclos_pontos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ciclos_pontos
    ADD CONSTRAINT ciclos_pontos_pkey PRIMARY KEY (id);


--
-- Name: comerciais comerciais_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comerciais
    ADD CONSTRAINT comerciais_pkey PRIMARY KEY (id);


--
-- Name: comissoes_comerciais comissoes_comerciais_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comissoes_comerciais
    ADD CONSTRAINT comissoes_comerciais_pkey PRIMARY KEY (id);


--
-- Name: configuracoes_pontos configuracoes_pontos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracoes_pontos
    ADD CONSTRAINT configuracoes_pontos_pkey PRIMARY KEY (id);


--
-- Name: consultas consultas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultas
    ADD CONSTRAINT consultas_pkey PRIMARY KEY (id);


--
-- Name: consultores consultores_cpf_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultores
    ADD CONSTRAINT consultores_cpf_key UNIQUE (cpf);


--
-- Name: consultores consultores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultores
    ADD CONSTRAINT consultores_pkey PRIMARY KEY (id);


--
-- Name: cupons_config cupons_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cupons_config
    ADD CONSTRAINT cupons_config_pkey PRIMARY KEY (id);


--
-- Name: cupons_importados cupons_importados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cupons_importados
    ADD CONSTRAINT cupons_importados_pkey PRIMARY KEY (id);


--
-- Name: documentos documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_pkey PRIMARY KEY (id);


--
-- Name: estabelecimentos estabelecimentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estabelecimentos
    ADD CONSTRAINT estabelecimentos_pkey PRIMARY KEY (id);


--
-- Name: gestores_consultores gestores_consultores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gestores_consultores
    ADD CONSTRAINT gestores_consultores_pkey PRIMARY KEY (id);


--
-- Name: gestores gestores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gestores
    ADD CONSTRAINT gestores_pkey PRIMARY KEY (id);


--
-- Name: indicados indicados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indicados
    ADD CONSTRAINT indicados_pkey PRIMARY KEY (id);


--
-- Name: liderancas liderancas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.liderancas
    ADD CONSTRAINT liderancas_pkey PRIMARY KEY (id);


--
-- Name: metas_comerciais metas_comerciais_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metas_comerciais
    ADD CONSTRAINT metas_comerciais_pkey PRIMARY KEY (id);


--
-- Name: movimentacoes_pontos movimentacoes_pontos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_pontos
    ADD CONSTRAINT movimentacoes_pontos_pkey PRIMARY KEY (id);


--
-- Name: parceiros parceiros_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parceiros
    ADD CONSTRAINT parceiros_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: premios premios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.premios
    ADD CONSTRAINT premios_pkey PRIMARY KEY (id);


--
-- Name: primeira_acss primeira_acss_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.primeira_acss
    ADD CONSTRAINT primeira_acss_pkey PRIMARY KEY (id);


--
-- Name: procedimentos_pf procedimentos_pf_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procedimentos_pf
    ADD CONSTRAINT procedimentos_pf_pkey PRIMARY KEY (id);


--
-- Name: ranking_posicoes ranking_posicoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ranking_posicoes
    ADD CONSTRAINT ranking_posicoes_pkey PRIMARY KEY (id);


--
-- Name: ranking_snapshots ranking_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ranking_snapshots
    ADD CONSTRAINT ranking_snapshots_pkey PRIMARY KEY (id);


--
-- Name: regras_comerciais regras_comerciais_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regras_comerciais
    ADD CONSTRAINT regras_comerciais_pkey PRIMARY KEY (id);


--
-- Name: regras_gestores regras_gestores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regras_gestores
    ADD CONSTRAINT regras_gestores_pkey PRIMARY KEY (id);


--
-- Name: solicitacoes_resgate solicitacoes_resgate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitacoes_resgate
    ADD CONSTRAINT solicitacoes_resgate_pkey PRIMARY KEY (id);


--
-- Name: uploads_planilha_backoffice uploads_planilha_backoffice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uploads_planilha_backoffice
    ADD CONSTRAINT uploads_planilha_backoffice_pkey PRIMARY KEY (id);


--
-- Name: usuarios_estabelecimentos usuarios_estabelecimentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios_estabelecimentos
    ADD CONSTRAINT usuarios_estabelecimentos_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: backoffices_cpf_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX backoffices_cpf_key ON public.backoffices USING btree (cpf);


--
-- Name: backoffices_usuario_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX backoffices_usuario_id_key ON public.backoffices USING btree (usuario_id);


--
-- Name: ciclos_pontos_backoffice_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ciclos_pontos_backoffice_id_idx ON public.ciclos_pontos USING btree (backoffice_id);


--
-- Name: ciclos_pontos_backoffice_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ciclos_pontos_backoffice_id_status_idx ON public.ciclos_pontos USING btree (backoffice_id, status);


--
-- Name: ciclos_pontos_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ciclos_pontos_status_idx ON public.ciclos_pontos USING btree (status);


--
-- Name: comerciais_cpf_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX comerciais_cpf_key ON public.comerciais USING btree (cpf);


--
-- Name: comerciais_lideranca_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comerciais_lideranca_id_idx ON public.comerciais USING btree (lideranca_id);


--
-- Name: comerciais_tipo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comerciais_tipo_idx ON public.comerciais USING btree (tipo);


--
-- Name: comerciais_usuario_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX comerciais_usuario_id_key ON public.comerciais USING btree (usuario_id);


--
-- Name: comissoes_comerciais_comercial_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comissoes_comerciais_comercial_id_idx ON public.comissoes_comerciais USING btree (comercial_id);


--
-- Name: comissoes_comerciais_comercial_id_mes_referencia_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX comissoes_comerciais_comercial_id_mes_referencia_key ON public.comissoes_comerciais USING btree (comercial_id, mes_referencia);


--
-- Name: configuracoes_pontos_backoffice_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX configuracoes_pontos_backoffice_id_idx ON public.configuracoes_pontos USING btree (backoffice_id);


--
-- Name: configuracoes_pontos_vigente_desde_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX configuracoes_pontos_vigente_desde_idx ON public.configuracoes_pontos USING btree (vigente_desde);


--
-- Name: consultas_cupom_importado_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX consultas_cupom_importado_id_key ON public.consultas USING btree (cupom_importado_id);


--
-- Name: consultores_usuario_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX consultores_usuario_id_key ON public.consultores USING btree (usuario_id);


--
-- Name: cupons_config_codigo_cupom_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX cupons_config_codigo_cupom_key ON public.cupons_config USING btree (codigo_cupom);


--
-- Name: cupons_config_estabelecimento_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX cupons_config_estabelecimento_id_key ON public.cupons_config USING btree (estabelecimento_id);


--
-- Name: cupons_importados_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cupons_importados_status_idx ON public.cupons_importados USING btree (status);


--
-- Name: gestores_consultores_consultor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX gestores_consultores_consultor_id_idx ON public.gestores_consultores USING btree (consultor_id);


--
-- Name: gestores_consultores_gestor_id_consultor_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX gestores_consultores_gestor_id_consultor_id_key ON public.gestores_consultores USING btree (gestor_id, consultor_id);


--
-- Name: gestores_consultores_gestor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX gestores_consultores_gestor_id_idx ON public.gestores_consultores USING btree (gestor_id);


--
-- Name: gestores_cpf_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX gestores_cpf_key ON public.gestores USING btree (cpf);


--
-- Name: gestores_lideranca_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX gestores_lideranca_id_idx ON public.gestores USING btree (lideranca_id);


--
-- Name: gestores_usuario_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX gestores_usuario_id_key ON public.gestores USING btree (usuario_id);


--
-- Name: indicados_cpf_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX indicados_cpf_idx ON public.indicados USING btree (cpf);


--
-- Name: indicados_cpf_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX indicados_cpf_key ON public.indicados USING btree (cpf);


--
-- Name: indicados_parceiro_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX indicados_parceiro_id_idx ON public.indicados USING btree (parceiro_id);


--
-- Name: liderancas_backoffice_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX liderancas_backoffice_id_idx ON public.liderancas USING btree (backoffice_id);


--
-- Name: liderancas_cpf_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX liderancas_cpf_key ON public.liderancas USING btree (cpf);


--
-- Name: liderancas_tipo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX liderancas_tipo_idx ON public.liderancas USING btree (tipo);


--
-- Name: liderancas_usuario_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX liderancas_usuario_id_key ON public.liderancas USING btree (usuario_id);


--
-- Name: metas_comerciais_comercial_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metas_comerciais_comercial_id_idx ON public.metas_comerciais USING btree (comercial_id);


--
-- Name: metas_comerciais_comercial_id_mes_referencia_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX metas_comerciais_comercial_id_mes_referencia_key ON public.metas_comerciais USING btree (comercial_id, mes_referencia);


--
-- Name: movimentacoes_pontos_ciclo_pontos_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX movimentacoes_pontos_ciclo_pontos_id_idx ON public.movimentacoes_pontos USING btree (ciclo_pontos_id);


--
-- Name: movimentacoes_pontos_origem_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX movimentacoes_pontos_origem_idx ON public.movimentacoes_pontos USING btree (origem);


--
-- Name: movimentacoes_pontos_parceiro_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX movimentacoes_pontos_parceiro_id_idx ON public.movimentacoes_pontos USING btree (parceiro_id);


--
-- Name: movimentacoes_pontos_referencia_procedimento_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX movimentacoes_pontos_referencia_procedimento_id_idx ON public.movimentacoes_pontos USING btree (referencia_procedimento_id);


--
-- Name: movimentacoes_pontos_referencia_solicitacao_resgate_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX movimentacoes_pontos_referencia_solicitacao_resgate_id_idx ON public.movimentacoes_pontos USING btree (referencia_solicitacao_resgate_id);


--
-- Name: parceiros_comercial_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX parceiros_comercial_id_idx ON public.parceiros USING btree (comercial_id);


--
-- Name: parceiros_cpf_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX parceiros_cpf_key ON public.parceiros USING btree (cpf);


--
-- Name: parceiros_gestor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX parceiros_gestor_id_idx ON public.parceiros USING btree (gestor_id);


--
-- Name: parceiros_usuario_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX parceiros_usuario_id_key ON public.parceiros USING btree (usuario_id);


--
-- Name: password_reset_tokens_expires_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX password_reset_tokens_expires_at_idx ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: password_reset_tokens_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX password_reset_tokens_token_key ON public.password_reset_tokens USING btree (token);


--
-- Name: password_reset_tokens_usuario_estabelecimento_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX password_reset_tokens_usuario_estabelecimento_id_idx ON public.password_reset_tokens USING btree (usuario_estabelecimento_id);


--
-- Name: password_reset_tokens_usuario_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX password_reset_tokens_usuario_id_idx ON public.password_reset_tokens USING btree (usuario_id);


--
-- Name: premios_ativo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX premios_ativo_idx ON public.premios USING btree (ativo);


--
-- Name: premios_backoffice_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX premios_backoffice_id_idx ON public.premios USING btree (backoffice_id);


--
-- Name: primeira_acss_token_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX primeira_acss_token_idx ON public.primeira_acss USING btree (token);


--
-- Name: primeira_acss_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX primeira_acss_token_key ON public.primeira_acss USING btree (token);


--
-- Name: procedimentos_pf_comercial_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX procedimentos_pf_comercial_id_idx ON public.procedimentos_pf USING btree (comercial_id);


--
-- Name: procedimentos_pf_cpf_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX procedimentos_pf_cpf_idx ON public.procedimentos_pf USING btree (cpf);


--
-- Name: procedimentos_pf_data_referencia_cpf_procedimento_unidade_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX procedimentos_pf_data_referencia_cpf_procedimento_unidade_key ON public.procedimentos_pf USING btree (data_referencia, cpf, procedimento, unidade);


--
-- Name: procedimentos_pf_gestor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX procedimentos_pf_gestor_id_idx ON public.procedimentos_pf USING btree (gestor_id);


--
-- Name: procedimentos_pf_indicado_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX procedimentos_pf_indicado_id_idx ON public.procedimentos_pf USING btree (indicado_id);


--
-- Name: procedimentos_pf_parceiro_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX procedimentos_pf_parceiro_id_idx ON public.procedimentos_pf USING btree (parceiro_id);


--
-- Name: procedimentos_pf_upload_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX procedimentos_pf_upload_id_idx ON public.procedimentos_pf USING btree (upload_id);


--
-- Name: ranking_posicoes_parceiro_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ranking_posicoes_parceiro_id_idx ON public.ranking_posicoes USING btree (parceiro_id);


--
-- Name: ranking_posicoes_ranking_snapshot_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ranking_posicoes_ranking_snapshot_id_idx ON public.ranking_posicoes USING btree (ranking_snapshot_id);


--
-- Name: ranking_posicoes_ranking_snapshot_id_parceiro_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ranking_posicoes_ranking_snapshot_id_parceiro_id_key ON public.ranking_posicoes USING btree (ranking_snapshot_id, parceiro_id);


--
-- Name: ranking_snapshots_ciclo_pontos_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ranking_snapshots_ciclo_pontos_id_idx ON public.ranking_snapshots USING btree (ciclo_pontos_id);


--
-- Name: ranking_snapshots_ciclo_pontos_id_referencia_mes_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ranking_snapshots_ciclo_pontos_id_referencia_mes_key ON public.ranking_snapshots USING btree (ciclo_pontos_id, referencia_mes);


--
-- Name: regras_comerciais_backoffice_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX regras_comerciais_backoffice_id_idx ON public.regras_comerciais USING btree (backoffice_id);


--
-- Name: regras_gestores_backoffice_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX regras_gestores_backoffice_id_idx ON public.regras_gestores USING btree (backoffice_id);


--
-- Name: solicitacoes_resgate_ciclo_pontos_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX solicitacoes_resgate_ciclo_pontos_id_idx ON public.solicitacoes_resgate USING btree (ciclo_pontos_id);


--
-- Name: solicitacoes_resgate_parceiro_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX solicitacoes_resgate_parceiro_id_idx ON public.solicitacoes_resgate USING btree (parceiro_id);


--
-- Name: solicitacoes_resgate_premio_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX solicitacoes_resgate_premio_id_idx ON public.solicitacoes_resgate USING btree (premio_id);


--
-- Name: solicitacoes_resgate_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX solicitacoes_resgate_status_idx ON public.solicitacoes_resgate USING btree (status);


--
-- Name: uploads_planilha_backoffice_backoffice_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX uploads_planilha_backoffice_backoffice_id_idx ON public.uploads_planilha_backoffice USING btree (backoffice_id);


--
-- Name: uploads_planilha_backoffice_mes_referencia_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX uploads_planilha_backoffice_mes_referencia_idx ON public.uploads_planilha_backoffice USING btree (mes_referencia);


--
-- Name: usuarios_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX usuarios_email_key ON public.usuarios USING btree (email);


--
-- Name: usuarios_estabelecimentos_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX usuarios_estabelecimentos_email_key ON public.usuarios_estabelecimentos USING btree (email);


--
-- Name: usuarios_estabelecimentos_estabelecimento_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX usuarios_estabelecimentos_estabelecimento_id_idx ON public.usuarios_estabelecimentos USING btree (estabelecimento_id);


--
-- Name: audit_logs audit_logs_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: backoffices backoffices_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backoffices
    ADD CONSTRAINT backoffices_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ciclos_pontos ciclos_pontos_backoffice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ciclos_pontos
    ADD CONSTRAINT ciclos_pontos_backoffice_id_fkey FOREIGN KEY (backoffice_id) REFERENCES public.backoffices(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: comerciais comerciais_lideranca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comerciais
    ADD CONSTRAINT comerciais_lideranca_id_fkey FOREIGN KEY (lideranca_id) REFERENCES public.liderancas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: comerciais comerciais_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comerciais
    ADD CONSTRAINT comerciais_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: comissoes_comerciais comissoes_comerciais_comercial_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comissoes_comerciais
    ADD CONSTRAINT comissoes_comerciais_comercial_id_fkey FOREIGN KEY (comercial_id) REFERENCES public.comerciais(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: configuracoes_pontos configuracoes_pontos_backoffice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracoes_pontos
    ADD CONSTRAINT configuracoes_pontos_backoffice_id_fkey FOREIGN KEY (backoffice_id) REFERENCES public.backoffices(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: consultas consultas_cupom_importado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultas
    ADD CONSTRAINT consultas_cupom_importado_id_fkey FOREIGN KEY (cupom_importado_id) REFERENCES public.cupons_importados(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: consultores consultores_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultores
    ADD CONSTRAINT consultores_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cupons_config cupons_config_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cupons_config
    ADD CONSTRAINT cupons_config_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cupons_config cupons_config_estabelecimento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cupons_config
    ADD CONSTRAINT cupons_config_estabelecimento_id_fkey FOREIGN KEY (estabelecimento_id) REFERENCES public.estabelecimentos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cupons_importados cupons_importados_cupom_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cupons_importados
    ADD CONSTRAINT cupons_importados_cupom_config_id_fkey FOREIGN KEY (cupom_config_id) REFERENCES public.cupons_config(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: documentos documentos_estabelecimento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_estabelecimento_id_fkey FOREIGN KEY (estabelecimento_id) REFERENCES public.estabelecimentos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: estabelecimentos estabelecimentos_consultor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estabelecimentos
    ADD CONSTRAINT estabelecimentos_consultor_id_fkey FOREIGN KEY (consultor_id) REFERENCES public.consultores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: gestores_consultores gestores_consultores_consultor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gestores_consultores
    ADD CONSTRAINT gestores_consultores_consultor_id_fkey FOREIGN KEY (consultor_id) REFERENCES public.consultores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: gestores_consultores gestores_consultores_gestor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gestores_consultores
    ADD CONSTRAINT gestores_consultores_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: gestores gestores_lideranca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gestores
    ADD CONSTRAINT gestores_lideranca_id_fkey FOREIGN KEY (lideranca_id) REFERENCES public.liderancas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: gestores gestores_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gestores
    ADD CONSTRAINT gestores_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: indicados indicados_parceiro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indicados
    ADD CONSTRAINT indicados_parceiro_id_fkey FOREIGN KEY (parceiro_id) REFERENCES public.parceiros(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: liderancas liderancas_backoffice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.liderancas
    ADD CONSTRAINT liderancas_backoffice_id_fkey FOREIGN KEY (backoffice_id) REFERENCES public.backoffices(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: liderancas liderancas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.liderancas
    ADD CONSTRAINT liderancas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: metas_comerciais metas_comerciais_comercial_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metas_comerciais
    ADD CONSTRAINT metas_comerciais_comercial_id_fkey FOREIGN KEY (comercial_id) REFERENCES public.comerciais(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: movimentacoes_pontos movimentacoes_pontos_ciclo_pontos_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_pontos
    ADD CONSTRAINT movimentacoes_pontos_ciclo_pontos_id_fkey FOREIGN KEY (ciclo_pontos_id) REFERENCES public.ciclos_pontos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: movimentacoes_pontos movimentacoes_pontos_parceiro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_pontos
    ADD CONSTRAINT movimentacoes_pontos_parceiro_id_fkey FOREIGN KEY (parceiro_id) REFERENCES public.parceiros(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: parceiros parceiros_comercial_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parceiros
    ADD CONSTRAINT parceiros_comercial_id_fkey FOREIGN KEY (comercial_id) REFERENCES public.comerciais(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: parceiros parceiros_gestor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parceiros
    ADD CONSTRAINT parceiros_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES public.gestores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: parceiros parceiros_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parceiros
    ADD CONSTRAINT parceiros_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: password_reset_tokens password_reset_tokens_usuario_estabelecimento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_usuario_estabelecimento_id_fkey FOREIGN KEY (usuario_estabelecimento_id) REFERENCES public.usuarios_estabelecimentos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: password_reset_tokens password_reset_tokens_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: premios premios_backoffice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.premios
    ADD CONSTRAINT premios_backoffice_id_fkey FOREIGN KEY (backoffice_id) REFERENCES public.backoffices(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: primeira_acss primeira_acss_parceiro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.primeira_acss
    ADD CONSTRAINT primeira_acss_parceiro_id_fkey FOREIGN KEY (parceiro_id) REFERENCES public.parceiros(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: procedimentos_pf procedimentos_pf_comercial_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procedimentos_pf
    ADD CONSTRAINT procedimentos_pf_comercial_id_fkey FOREIGN KEY (comercial_id) REFERENCES public.comerciais(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: procedimentos_pf procedimentos_pf_gestor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procedimentos_pf
    ADD CONSTRAINT procedimentos_pf_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES public.gestores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: procedimentos_pf procedimentos_pf_indicado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procedimentos_pf
    ADD CONSTRAINT procedimentos_pf_indicado_id_fkey FOREIGN KEY (indicado_id) REFERENCES public.indicados(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: procedimentos_pf procedimentos_pf_parceiro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procedimentos_pf
    ADD CONSTRAINT procedimentos_pf_parceiro_id_fkey FOREIGN KEY (parceiro_id) REFERENCES public.parceiros(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: procedimentos_pf procedimentos_pf_upload_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procedimentos_pf
    ADD CONSTRAINT procedimentos_pf_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES public.uploads_planilha_backoffice(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ranking_posicoes ranking_posicoes_parceiro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ranking_posicoes
    ADD CONSTRAINT ranking_posicoes_parceiro_id_fkey FOREIGN KEY (parceiro_id) REFERENCES public.parceiros(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ranking_posicoes ranking_posicoes_ranking_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ranking_posicoes
    ADD CONSTRAINT ranking_posicoes_ranking_snapshot_id_fkey FOREIGN KEY (ranking_snapshot_id) REFERENCES public.ranking_snapshots(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ranking_snapshots ranking_snapshots_ciclo_pontos_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ranking_snapshots
    ADD CONSTRAINT ranking_snapshots_ciclo_pontos_id_fkey FOREIGN KEY (ciclo_pontos_id) REFERENCES public.ciclos_pontos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: regras_comerciais regras_comerciais_backoffice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regras_comerciais
    ADD CONSTRAINT regras_comerciais_backoffice_id_fkey FOREIGN KEY (backoffice_id) REFERENCES public.backoffices(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: regras_gestores regras_gestores_backoffice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regras_gestores
    ADD CONSTRAINT regras_gestores_backoffice_id_fkey FOREIGN KEY (backoffice_id) REFERENCES public.backoffices(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: solicitacoes_resgate solicitacoes_resgate_ciclo_pontos_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitacoes_resgate
    ADD CONSTRAINT solicitacoes_resgate_ciclo_pontos_id_fkey FOREIGN KEY (ciclo_pontos_id) REFERENCES public.ciclos_pontos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: solicitacoes_resgate solicitacoes_resgate_parceiro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitacoes_resgate
    ADD CONSTRAINT solicitacoes_resgate_parceiro_id_fkey FOREIGN KEY (parceiro_id) REFERENCES public.parceiros(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: solicitacoes_resgate solicitacoes_resgate_premio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitacoes_resgate
    ADD CONSTRAINT solicitacoes_resgate_premio_id_fkey FOREIGN KEY (premio_id) REFERENCES public.premios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: usuarios_estabelecimentos usuarios_estabelecimentos_estabelecimento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios_estabelecimentos
    ADD CONSTRAINT usuarios_estabelecimentos_estabelecimento_id_fkey FOREIGN KEY (estabelecimento_id) REFERENCES public.estabelecimentos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: audit_logs asa_app_full_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY asa_app_full_access ON public.audit_logs TO asa_app USING (true) WITH CHECK (true);


--
-- Name: consultas asa_app_full_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY asa_app_full_access ON public.consultas TO asa_app USING (true) WITH CHECK (true);


--
-- Name: consultores asa_app_full_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY asa_app_full_access ON public.consultores TO asa_app USING (true) WITH CHECK (true);


--
-- Name: cupons_config asa_app_full_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY asa_app_full_access ON public.cupons_config TO asa_app USING (true) WITH CHECK (true);


--
-- Name: cupons_importados asa_app_full_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY asa_app_full_access ON public.cupons_importados TO asa_app USING (true) WITH CHECK (true);


--
-- Name: documentos asa_app_full_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY asa_app_full_access ON public.documentos TO asa_app USING (true) WITH CHECK (true);


--
-- Name: estabelecimentos asa_app_full_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY asa_app_full_access ON public.estabelecimentos TO asa_app USING (true) WITH CHECK (true);


--
-- Name: gestores_consultores asa_app_full_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY asa_app_full_access ON public.gestores_consultores TO asa_app USING (true) WITH CHECK (true);


--
-- Name: usuarios asa_app_full_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY asa_app_full_access ON public.usuarios TO asa_app USING (true) WITH CHECK (true);


--
-- Name: usuarios_estabelecimentos asa_app_full_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY asa_app_full_access ON public.usuarios_estabelecimentos TO asa_app USING (true) WITH CHECK (true);


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: consultas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

--
-- Name: consultores; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.consultores ENABLE ROW LEVEL SECURITY;

--
-- Name: cupons_config; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cupons_config ENABLE ROW LEVEL SECURITY;

--
-- Name: cupons_importados; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cupons_importados ENABLE ROW LEVEL SECURITY;

--
-- Name: documentos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

--
-- Name: estabelecimentos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.estabelecimentos ENABLE ROW LEVEL SECURITY;

--
-- Name: gestores_consultores; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.gestores_consultores ENABLE ROW LEVEL SECURITY;

--
-- Name: usuarios; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

--
-- Name: usuarios_estabelecimentos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.usuarios_estabelecimentos ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO asa_app;


--
-- Name: TABLE _prisma_migrations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public._prisma_migrations TO asa_app;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audit_logs TO asa_app;


--
-- Name: TABLE backoffices; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.backoffices TO asa_app;


--
-- Name: TABLE base_clientes_acesso_saude; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.base_clientes_acesso_saude TO asa_app;


--
-- Name: TABLE ciclos_pontos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ciclos_pontos TO asa_app;


--
-- Name: TABLE comerciais; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.comerciais TO asa_app;


--
-- Name: TABLE comissoes_comerciais; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.comissoes_comerciais TO asa_app;


--
-- Name: TABLE configuracoes_pontos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.configuracoes_pontos TO asa_app;


--
-- Name: TABLE consultas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.consultas TO asa_app;


--
-- Name: TABLE consultores; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.consultores TO asa_app;


--
-- Name: TABLE cupons_config; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.cupons_config TO asa_app;


--
-- Name: TABLE cupons_importados; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.cupons_importados TO asa_app;


--
-- Name: TABLE documentos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.documentos TO asa_app;


--
-- Name: TABLE estabelecimentos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.estabelecimentos TO asa_app;


--
-- Name: TABLE gestores; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.gestores TO asa_app;


--
-- Name: TABLE gestores_consultores; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.gestores_consultores TO asa_app;


--
-- Name: TABLE indicados; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.indicados TO asa_app;


--
-- Name: TABLE liderancas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.liderancas TO asa_app;


--
-- Name: TABLE metas_comerciais; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.metas_comerciais TO asa_app;


--
-- Name: TABLE movimentacoes_pontos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.movimentacoes_pontos TO asa_app;


--
-- Name: TABLE parceiros; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.parceiros TO asa_app;


--
-- Name: TABLE password_reset_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.password_reset_tokens TO asa_app;


--
-- Name: TABLE premios; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.premios TO asa_app;


--
-- Name: TABLE primeira_acss; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.primeira_acss TO asa_app;


--
-- Name: TABLE procedimentos_pf; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.procedimentos_pf TO asa_app;


--
-- Name: TABLE ranking_posicoes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ranking_posicoes TO asa_app;


--
-- Name: TABLE ranking_snapshots; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ranking_snapshots TO asa_app;


--
-- Name: TABLE regras_comerciais; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.regras_comerciais TO asa_app;


--
-- Name: TABLE regras_gestores; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.regras_gestores TO asa_app;


--
-- Name: TABLE solicitacoes_resgate; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.solicitacoes_resgate TO asa_app;


--
-- Name: TABLE uploads_planilha_backoffice; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.uploads_planilha_backoffice TO asa_app;


--
-- Name: TABLE usuarios; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.usuarios TO asa_app;


--
-- Name: TABLE usuarios_estabelecimentos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.usuarios_estabelecimentos TO asa_app;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,USAGE ON SEQUENCES TO asa_app;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO asa_app;


--
-- PostgreSQL database dump complete
--

