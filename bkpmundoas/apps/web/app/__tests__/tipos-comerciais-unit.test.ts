import { describe, it, expect } from "vitest";
import type { RegrasComerciais, RegrasGestores, RegrasFaltas, RegraItem } from "../../app/(dashboard)/backoffice/usuarios/comerciais/types";

describe("usuarios/comerciais/types - interfaces", () => {
  it("deve exportar RegraItem", () => {
    const item: RegraItem = { id: "i1", nome: "Regra A", percentual: 0.1 };
    expect(item.id).toBe("i1");
  });

  it("deve aceitar RegrasComerciais", () => {
    const rc: RegrasComerciais = {
      id: "r1",
      cartaoAcessoSaude: 0,
      cireAtivo: 0,
      cireReceptivo: 0,
      franchisingAcesso: 0,
      franchisingCartao: 0,
      unidade: 0,
      itens: [],
    };
    expect(rc.id).toBe("r1");
  });

  it("deve aceitar RegrasGestores", () => {
    const rg: RegrasGestores = {
      id: "r2",
      gerenteCire: 0,
      supervisorAtivo: 0,
      supervisorReceptivo: 0,
      supervisorFranquia: 0,
      supervisorAtendimento: 0,
      gerenteAtendimento: 0,
      supervisorComercial: 0,
      itens: [],
    };
    expect(rg.id).toBe("r2");
  });

  it("deve aceitar RegrasFaltas", () => {
    const rf: RegrasFaltas = {
      id: "r3",
      consultorUnidadeComFalta: 0,
      consultorUnidadeSemFalta: 0,
      supervisorAtendimentoComFalta: 0,
      supervisorAtendimentoSemFalta: 0,
      gerenteComercialComFalta: 0,
      gerenteComercialSemFalta: 0,
      itens: [],
    };
    expect(rf.id).toBe("r3");
  });
});
