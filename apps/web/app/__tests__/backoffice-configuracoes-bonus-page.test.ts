import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '../..');
const read = (...parts: string[]) => readFileSync(join(root, ...parts), 'utf8');

const bonusPage = read('app', '(dashboard)', 'backoffice', 'configuracoes', 'bonus', 'page.tsx');
const configuracaoBonusComponent = read('app', '(dashboard)', 'backoffice', 'configuracoes', 'bonus', 'components', 'configuracao-bonus.tsx');
const bonusConsultorPf = read('app', '(dashboard)', 'backoffice', 'metas-vendas', 'components', 'bonus-consultor-pf.tsx');
const navManifest = read('lib', 'nav', 'manifest.ts');
const bonusApiRoute = read('app', 'api', 'v1', 'backoffice', 'configuracoes', 'bonus', 'route.ts');
const schema = read('..', '..', 'packages', 'database', 'prisma', 'schema.prisma');

describe('Configuracoes Bonus - regressão', () => {
  it('expõe a página /backoffice/configuracoes/bonus', () => {
    expect(bonusPage).toContain('Configurações · Bônus');
    expect(bonusPage).toContain('Conversão de Produção em Bônus');
    expect(bonusPage).toContain('Ciclos e Reset');
  });

  it('renderiza ConfiguracaoBonus e BonusConsultorPf na página', () => {
    expect(bonusPage).toContain('ConfiguracaoBonus');
    expect(bonusPage).toContain('BonusConsultorPf');
  });

  it('componente de configuração espelha o padrão de ConfiguracaoPontos', () => {
    expect(configuracaoBonusComponent).toContain('valorPorPonto');
    expect(configuracaoBonusComponent).toContain('tipoArredondamento');
    expect(configuracaoBonusComponent).toContain('PISO');
    expect(configuracaoBonusComponent).toContain('TETO');
    expect(configuracaoBonusComponent).toContain('PADRAO');
    expect(configuracaoBonusComponent).toContain('Histórico de Configurações');
    expect(configuracaoBonusComponent).toContain('vigente');
  });

  it('componente de configuração POSTa para /api/v1/backoffice/configuracoes/bonus', () => {
    expect(configuracaoBonusComponent).toContain('/api/v1/backoffice/configuracoes/bonus');
  });

  it('API de configuração de bônus segue o mesmo contrato da API de pontos', () => {
    expect(bonusApiRoute).toContain('requireBackofficeWithScope');
    expect(bonusApiRoute).toContain('configuracaoBonus');
    expect(bonusApiRoute).toContain('valorPorPonto: z.number().positive');
    expect(bonusApiRoute).toContain('tipoArredondamento: z.enum(["PISO", "TETO", "PADRAO"])');
    expect(bonusApiRoute).toContain('Já existe uma configuração de bônus vigente');
  });

  it('página mantém o conteúdo de ciclos/reset do backoffice', () => {
    expect(bonusPage).toContain('BonusConsultorPf');
    expect(bonusConsultorPf).toContain('Reset administrativo');
    expect(bonusConsultorPf).toContain('/api/v1/backoffice/pontos/bonus/ciclos');
  });

  it('não remove o menu Configurações · Bônus do nav', () => {
    expect(navManifest).toContain('href: "/backoffice/configuracoes/bonus"');
  });

  it('schema Prisma possui modelo ConfiguracaoBonus isolado', () => {
    expect(schema).toContain('model ConfiguracaoBonus');
    expect(schema).toContain('@@map("configuracoes_bonus")');
    expect(schema).toContain('valor_por_ponto');
    expect(schema).toContain('tipo_arredondamento');
    expect(schema).toContain('vigente_desde');
    expect(schema).toContain('configuracoesBonus        ConfiguracaoBonus[]');
  });
});
