import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Janela de resgate desde o início do ciclo", () => {
  const root = join(__dirname, "../..");
  const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");
  const cicloPost = read("app", "api", "v1", "backoffice", "pontos", "ciclos", "route.ts");
  const cicloPatch = read("app", "api", "v1", "backoffice", "pontos", "ciclos", "[id]", "route.ts");
  const bonusPost = read("app", "api", "v1", "backoffice", "pontos", "bonus", "ciclos", "route.ts");
  const bonusPatch = read("app", "api", "v1", "backoffice", "pontos", "bonus", "ciclos", "[id]", "route.ts");
  const parceiroResgate = read("app", "api", "v1", "parceiro", "pontos", "resgates", "route.ts");
  const bonusResgate = read("app", "api", "v1", "consultor", "bonus", "resgates", "route.ts");
  const parceiroCarteira = read("app", "api", "v1", "parceiro", "pontos", "carteira", "route.ts");
  const parceiroPremios = read("app", "api", "v1", "parceiro", "pontos", "premios", "route.ts");
  const parceiroCatalogo = read("components", "parceiro", "catalogo-premios.tsx");
  const form = read("app", "(dashboard)", "backoffice", "pontos", "components", "criar-ciclo-form.tsx");

  it("deriva o início do resgate do início do ciclo no CRUD principal", () => {
    expect(cicloPost).toContain("const inicioResgate = inicio");
    expect(cicloPatch).toContain("const inicioResgate = inicio");
    expect(cicloPost).not.toContain("Data de início do resgate deve ser posterior à data de fim de acúmulo");
    expect(cicloPatch).not.toContain("Data de início do resgate deve ser posterior à data de fim de acúmulo");
  });

  it("aplica a mesma regra aos ciclos de Bônus PF", () => {
    expect(bonusPost).toContain("inicioResgateEm: parsed.data.inicioAcumuloEm");
    expect(bonusPatch).toContain("const inicioResgate = inicio");
    expect(bonusPost).not.toContain("Início do resgate deve ser posterior ao fim do acúmulo");
    expect(bonusPatch).not.toContain("fim >= inicioResgate");
  });

  it("permite solicitar resgate durante EM_ANDAMENTO dentro da janela", () => {
    expect(parceiroResgate).toContain('status: { in: ["EM_ANDAMENTO", "RESGATE_ABERTO"] }');
    expect(bonusResgate).toContain('status: { in: ["EM_ANDAMENTO", "RESGATE_ABERTO"] }');
    expect(parceiroResgate).toContain("inicioResgateEm: { lte: now }");
    expect(bonusResgate).toContain("fimResgateEm: { gte: new Date() }");
    expect(parceiroPremios).toContain('status: { in: ["EM_ANDAMENTO", "RESGATE_ABERTO"] }');
    expect(parceiroPremios).toContain("const emPeriodoResgate = !!cicloResgateAberto");
    expect(parceiroCatalogo).toContain("A janela vai do início");
  });

  it("expõe ao Parceiro a janela desde o início do ciclo", () => {
    expect(parceiroCarteira).toContain("const inicioResgate = cicloVigente.inicioResgateEm ?? cicloVigente.inicioAcumuloEm");
    expect(parceiroCarteira).toContain("inicio: inicioResgate.toISOString()");
    expect(parceiroCarteira).not.toContain("inicio: cicloVigente.fimAcumuloEm.toISOString()");
  });

  it("não oferece mais um campo manual de início do resgate", () => {
    expect(form).not.toContain('id="inicioResgate"');
    expect(form).toContain("O resgate começa automaticamente no primeiro dia do ciclo");
  });
});
