import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../..");
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");

const equipeBonusPage = read("app", "(dashboard)", "backoffice", "equipe", "bonus", "page.tsx");
const bonusBackoffice = read("app", "(dashboard)", "backoffice", "metas-vendas", "components", "bonus-consultor-pf.tsx");
const bonusConsultor = read("app", "(dashboard)", "consultor", "bonus", "page.tsx");
const navManifest = read("lib", "nav", "manifest.ts");
const bonusCiclos = read("app", "api", "v1", "backoffice", "pontos", "bonus", "ciclos", "route.ts");
const bonusCicloId = read("app", "api", "v1", "backoffice", "pontos", "bonus", "ciclos", "[id]", "route.ts");
const bonusDistribuir = read("app", "api", "v1", "backoffice", "pontos", "bonus", "distribuir", "route.ts");
const bonusReset = read("app", "api", "v1", "backoffice", "pontos", "bonus", "reset", "route.ts");
const bonusCarteira = read("app", "api", "v1", "consultor", "bonus", "carteira", "route.ts");
const bonusPremios = read("app", "api", "v1", "consultor", "bonus", "premios", "route.ts");
const bonusResgates = read("app", "api", "v1", "consultor", "bonus", "resgates", "route.ts");
const pontosUtils = read("lib", "pontos-utils.ts");
const reprocessarComissoes = read("app", "api", "v1", "backoffice", "reprocessar-comissoes", "route.ts");
const schema = read("..", "..", "packages", "database", "prisma", "schema.prisma");
const resetMigration = read(
  "..",
  "..",
  "packages",
  "database",
  "prisma",
  "migrations",
  "20260827010000_add_reset_bonus_origin",
  "migration.sql",
);

describe("Bônus PF — integração completa", () => {
  it("expõe o painel de Bônus na área de Equipe e renderiza o componente correto", () => {
    expect(equipeBonusPage).toContain("BonusConsultorPf");
    expect(equipeBonusPage).toContain("Bonificação");
  });

  it("expõe Bônus no menu do Consultor PF", () => {
    expect(navManifest).toContain("/consultor/bonus");
    expect(bonusConsultor).toContain("/api/v1/consultor/bonus/carteira");
    expect(bonusConsultor).toContain("/api/v1/consultor/bonus/premios");
    expect(bonusConsultor).toContain("/api/v1/consultor/bonus/resgates");
    expect(bonusConsultor).toContain("Extrato de Bônus");
  });

  it("mantém ciclos PF isolados por Backoffice e sem Periodicidade na UI", () => {
    expect(bonusBackoffice).toContain("/api/v1/backoffice/pontos/bonus/ciclos");
    expect(bonusBackoffice).toContain("/api/v1/backoffice/pontos/bonus/ciclos/");
    expect(bonusBackoffice).toContain("Editar ciclo de bonificação");
    expect(bonusBackoffice).toContain("Deletar");
    expect(bonusBackoffice).toContain("inicioAcumuloEm");
    expect(bonusBackoffice).toContain("fimAcumuloEm");
    expect(bonusBackoffice).not.toContain("Periodicidade");
    expect(bonusCiclos).toContain('publico: "CONSULTOR_PF"');
    expect(bonusCiclos).toContain("backofficeId: backofficeId!");
    expect(bonusCiclos).toContain("Já existe ciclo de Bônus PF sobreposto");
    expect(bonusCicloId).toContain('publico: "CONSULTOR_PF"');
    expect(bonusCicloId).toContain("backofficeId: backofficeId!");
  });

  it("converte produção elegível em pontos e marca a modalidade como Bônus", () => {
    expect(bonusDistribuir).toContain('modalidadeContemplacao: "COMISSAO"');
    expect(bonusDistribuir).toContain('modalidadeContemplacao: "BONUS_PONTOS"');
    expect(bonusDistribuir).toContain("valorComissao: 0");
    expect(bonusDistribuir).toContain('origem: "PRODUCAO_IMPORTADA"');
    expect(bonusDistribuir).toContain("referenciaProcedimentoId: producao.id");
    expect(pontosUtils).toContain("creditarBonusConsultorPfPorProducao");
    expect(pontosUtils).toContain("calcularSaldoBonusConsultorPf");
    expect(pontosUtils).toContain('consultorPfId: params.consultorPfId');
  });

  it("impede dupla contemplação: comissão só processa procedimentos ainda marcados como COMISSAO", () => {
    expect(reprocessarComissoes).toContain('modalidadeContemplacao: "COMISSAO"');
    expect(bonusDistribuir).toContain('modalidadeContemplacao: "COMISSAO"');
    expect(bonusDistribuir).toContain('modalidadeContemplacao: "BONUS_PONTOS"');
  });

  it("mantém carteira, prêmios e resgates segregados para Consultor PF", () => {
    expect(bonusCarteira).toContain("requireConsultorPfWithScope");
    expect(bonusCarteira).toContain("consultorPfId");
    expect(bonusCarteira).toContain("obterCicloBonusConsultorPf");
    expect(bonusPremios).toContain("requireConsultorPfWithScope");
    expect(bonusPremios).toContain("backofficeId: backofficeId!");
    expect(bonusPremios).toContain("ativo: true");
    expect(bonusResgates).toContain("consultorPfId: consultorPfId!");
    expect(bonusResgates).toContain("backofficeId: backofficeId!");
    expect(bonusResgates).toContain('tipo: "DEBITO"');
    expect(bonusResgates).toContain("prisma.$transaction");
    expect(bonusResgates).toContain("Saldo insuficiente");
  });

  it("implementa reset administrativo auditável sem apagar o extrato", () => {
    expect(bonusReset).toContain("requireBackofficeWithScope");
    expect(bonusReset).toContain("backofficeId: backofficeId!");
    expect(bonusReset).toContain('origem: "RESET_ADMINISTRATIVO"');
    expect(bonusReset).toContain("prisma.$transaction");
    expect(bonusReset).toContain("criarAuditLog");
    expect(bonusReset).toContain("pontosResetados");
    expect(bonusBackoffice).toContain("O lançamento ficará preservado no extrato");
  });

  it("segue o design pattern da tela de Pontos", () => {
    expect(bonusBackoffice).toContain("border-gray-200");
    expect(bonusBackoffice).toContain("bg-gray-50");
    expect(bonusBackoffice).toContain("bg-primary-600");
    expect(bonusBackoffice).toContain("bg-blue-100");
    expect(bonusBackoffice).toContain("bg-red-100");
    expect(bonusBackoffice).toContain("Criar novo ciclo");
    expect(bonusBackoffice).toContain('type="date"');
    expect(bonusBackoffice).toContain("O resgate começa automaticamente no primeiro dia do ciclo");
    expect(bonusBackoffice).toContain("toast.success");
    expect(bonusBackoffice).not.toContain("border-violet-200");
    expect(bonusBackoffice).not.toContain("bg-violet-600");
    expect(bonusBackoffice).not.toContain("datetime-local");
    expect(bonusBackoffice).not.toContain("Periodicidade");
  });

  it("mantém ranking PF separado do ranking de Parceiros", () => {
    expect(schema).toContain("RankingSnapshotConsultorPf");
    expect(schema).toContain("RankingPosicaoConsultorPf");
    expect(schema).toContain('@@map("ranking_snapshots_consultores_pf")');
    expect(schema).toContain('@@map("ranking_posicoes_consultores_pf")');
    expect(schema).toContain("CONSULTOR_PF");
  });

  it("mantém enums, modalidade e migration do reset no schema", () => {
    expect(schema).toContain("enum PublicoCicloPontos");
    expect(schema).toContain("enum ModalidadeContemplacao");
    expect(schema).toContain("BONUS_PONTOS");
    expect(schema).toContain("RESET_ADMINISTRATIVO");
    expect(schema).toContain("modalidadeContemplacao");
    expect(resetMigration).toContain("ADD VALUE IF NOT EXISTS 'RESET_ADMINISTRATIVO'");
  });
});
