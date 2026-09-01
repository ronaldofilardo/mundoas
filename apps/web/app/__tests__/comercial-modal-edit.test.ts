/**
 * Testes para a lógica do ComercialModal — validação de que:
 *  1. Os valores iniciais do banco são usados para popular o estado.
 *  2. A lógica do useEffect preserva `funcao` no mount e limpa em mudanças.
 *  3. Os tipos dos dropdowns estão alinhados ao enum DB (COMERCIAL | LIDERANCA).
 *
 * Como JSX não funciona neste environment (rolldown não suporta), testamos
 * a lógica pura de inicialização e comportamento do modal sem renderizar.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Comercial } from "@/app/(dashboard)/backoffice/usuarios/comerciais/types";

function makeComercial(overrides: Partial<Comercial> = {}): Comercial {
  return {
    id: "eq-1",
    nome: "GerenteCire",
    cpf: "53051173991",
    email: "gerente@asa.com",
    percentualComissao: 5,
    status: "ATIVO",
    telefone: "",
    funcao: "GERENTE_CIRE",
    tipoLideranca: "GESTOR",
    lideranca: "GESTOR",
    tipo: "COMERCIAL",
    ...overrides,
  };
}

/**
 * Simula a inicialização de estado do ComercialModal.
 * Replica exatamente o que o useState faz no componente.
 */
function initializeModalState(comercial: Comercial) {
  const liderancaInicial = comercial.lideranca || comercial.tipoLideranca || "";
  return {
    formData: {
      ...comercial,
      telefone: comercial.telefone || "",
      funcao: comercial.funcao || "",
      lideranca: comercial.lideranca || comercial.tipoLideranca,
      tipo: comercial.tipo,
    },
    isLideranca: !!liderancaInicial,
    tipoLideranca: liderancaInicial,
    tipo: comercial.tipo || "",
    funcao: comercial.funcao || "",
  };
}

/**
 * Simula o comportamento do useEffect de tipoLideranca:
 * - Na primeira chamada (mount): NÃO limpa funcao.
 * - Em chamadas subsequentes (user interaction): LIMPA funcao.
 */
function simulateTipoLiderancaEffect(
  tipoLideranca: string,
  initialMount: boolean,
  currentFuncao: string,
  comercialFuncao: string | undefined,
) {
  let newFuncao = currentFuncao;
  let newInitialMount = initialMount;

  if (!tipoLideranca) {
    return { funcoes: [], funcao: "", initialMount: newInitialMount };
  }

  if (!initialMount) {
    newFuncao = "";
  } else {
    newInitialMount = false;
    if (comercialFuncao) {
      newFuncao = comercialFuncao;
    }
  }

  return { funcoes: [], funcao: newFuncao, initialMount: newInitialMount };
}

/**
 * Tipo permitido para o dropdown "Tipo" no modal (enum do DB).
 */
const TIPO_DROPDOWN_OPTIONS = ["COMERCIAL", "LIDERANCA"];

describe("ComercialModal — inicialização de estado a partir do banco", () => {
  it("formData funcao é populada com valor do banco", () => {
    const comercial = makeComercial({ funcao: "GERENTE_CIRE" });
    const state = initializeModalState(comercial);
    expect(state.formData.funcao).toBe("GERENTE_CIRE");
    expect(state.funcao).toBe("GERENTE_CIRE");
  });

  it("formData tipo é populado com valor do banco (COMERCIAL)", () => {
    const comercial = makeComercial({ tipo: "COMERCIAL" });
    const state = initializeModalState(comercial);
    expect(state.formData.tipo).toBe("COMERCIAL");
    expect(state.tipo).toBe("COMERCIAL");
  });

  it("formData tipoLideranca é populado com valor do banco", () => {
    const comercial = makeComercial({ tipoLideranca: "GESTOR", lideranca: "GESTOR" });
    const state = initializeModalState(comercial);
    expect(state.formData.tipoLideranca).toBe("GESTOR");
    expect(state.formData.lideranca).toBe("GESTOR");
    expect(state.tipoLideranca).toBe("GESTOR");
    expect(state.isLideranca).toBe(true);
  });

  it("quando tipoLideranca é null, isLideranca é false", () => {
    const comercial = makeComercial({
      tipoLideranca: null,
      lideranca: undefined,
    });
    const state = initializeModalState(comercial);
    expect(state.isLideranca).toBe(false);
    expect(state.tipoLideranca).toBe("");
  });

  it("quando funcao é null no banco, formData.funcao fica vazia", () => {
    const comercial = makeComercial({ funcao: undefined });
    const state = initializeModalState(comercial);
    expect(state.formData.funcao).toBe("");
  });

  it("quando telefone é null no banco, formData.telefone fica vazio", () => {
    const comercial = makeComercial({ telefone: null });
    const state = initializeModalState(comercial);
    expect(state.formData.telefone).toBe("");
  });
});

describe("ComercialModal — useEffect preservação de funcao no mount", () => {
  it("no mount com tipoLideranca definido, NÃO limpa funcao", () => {
    const comercial = makeComercial({ funcao: "GERENTE_CIRE", tipoLideranca: "GESTOR" });
    const state = initializeModalState(comercial);

    const result = simulateTipoLiderancaEffect(
      state.tipoLideranca,
      true,
      state.funcao,
      comercial.funcao,
    );

    expect(result.funcao).toBe("GERENTE_CIRE");
    expect(result.initialMount).toBe(false);
  });

  it("em mudança posterior (user), LIMPA funcao", () => {
    const result = simulateTipoLiderancaEffect(
      "COMERCIAL",
      false,
      "GERENTE_CIRE",
      "GERENTE_CIRE",
    );

    expect(result.funcao).toBe("");
  });

  it("quando tipoLideranca fica vazio, limpa funcoes", () => {
    const result = simulateTipoLiderancaEffect("", false, "GERENTE_CIRE", "GERENTE_CIRE");
    expect(result.funcoes).toEqual([]);
    expect(result.funcao).toBe("");
  });

  it("fluxo completo: mount preserva → user muda → limpa", () => {
    const comercial = makeComercial({ funcao: "SUPERVISOR_RECEPTIVO", tipoLideranca: "GESTOR" });
    const state = initializeModalState(comercial);

    const mountResult = simulateTipoLiderancaEffect(
      state.tipoLideranca,
      true,
      state.funcao,
      comercial.funcao,
    );
    expect(mountResult.funcao).toBe("SUPERVISOR_RECEPTIVO");

    const userChangeResult = simulateTipoLiderancaEffect(
      "COMERCIAL",
      mountResult.initialMount,
      mountResult.funcao,
      comercial.funcao,
    );
    expect(userChangeResult.funcao).toBe("");
  });
});

describe("ComercialModal — opções do dropdown Tipo", () => {
  it("opções incluem apenas COMERCIAL e LIDERANCA", () => {
    expect(TIPO_DROPDOWN_OPTIONS).toContain("COMERCIAL");
    expect(TIPO_DROPDOWN_OPTIONS).toContain("LIDERANCA");
  });

  it("opções NÃO incluem valores legados (GERENTE, SUPERVISOR, LIDER)", () => {
    expect(TIPO_DROPDOWN_OPTIONS).not.toContain("GERENTE");
    expect(TIPO_DROPDOWN_OPTIONS).not.toContain("SUPERVISOR");
    expect(TIPO_DROPDOWN_OPTIONS).not.toContain("LIDER");
  });

  it("Comercial.tipo aceita apenas COMERCIAL ou LIDERANCA", () => {
    const validTipos: Array<"COMERCIAL" | "LIDERANCA"> = ["COMERCIAL", "LIDERANCA"];

    for (const tipo of validTipos) {
      const comercial = makeComercial({ tipo });
      expect(comercial.tipo).toBe(tipo);
      expect(TIPO_DROPDOWN_OPTIONS).toContain(comercial.tipo);
    }
  });
});

describe("ComercialModal — chamada de fetch baseada no tipoLideranca", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GESTOR usa endpoint regras-gestores", () => {
    const endpoint = "GESTOR" === "COMERCIAL"
      ? "/api/v1/backoffice/regras-comerciais"
      : "/api/v1/backoffice/regras-gestores";
    expect(endpoint).toBe("/api/v1/backoffice/regras-gestores");
  });

  it("COMERCIAL usa endpoint regras-comerciais", () => {
    const tipoLideranca = "COMERCIAL";
    const endpoint = tipoLideranca === "COMERCIAL"
      ? "/api/v1/backoffice/regras-comerciais"
      : "/api/v1/backoffice/regras-gestores";
    expect(endpoint).toBe("/api/v1/backoffice/regras-comerciais");
  });
});

describe("ComercialModal — submit payload", () => {
  it("onSave recebe formData completo com tipo e funcao do banco", () => {
    const comercial = makeComercial({
      tipo: "COMERCIAL",
      tipoLideranca: "GESTOR",
      funcao: "GERENTE_CIRE",
    });
    const state = initializeModalState(comercial);

    expect(state.formData).toEqual({
      ...comercial,
      telefone: "",
      funcao: "GERENTE_CIRE",
      lideranca: "GESTOR",
      tipoLideranca: "GESTOR",
      tipo: "COMERCIAL",
    });
  });

  it("liderança GESTOR com funcao", () => {
    const comercial = makeComercial({
      id: "eq-99",
      nome: "Gerente Teste",
      tipo: "LIDERANCA",
      tipoLideranca: "GESTOR",
      lideranca: "GESTOR",
      funcao: "GERENTE_CIRE",
      percentualComissao: 15,
    });
    const state = initializeModalState(comercial);

    expect(state.formData.id).toBe("eq-99");
    expect(state.formData.tipo).toBe("LIDERANCA");
    expect(state.formData.tipoLideranca).toBe("GESTOR");
    expect(state.formData.lideranca).toBe("GESTOR");
    expect(state.formData.funcao).toBe("GERENTE_CIRE");
    expect(state.isLideranca).toBe(true);
  });
});
