import { describe, it, expect } from "vitest";
import type { RegrasGestores } from "../(dashboard)/backoffice/usuarios/comerciais/types";

describe("regras-gestores-form - interface de tipos", () => {
  it("deve aceitar estrutura RegrasGestores com itens", () => {
    const regras: RegrasGestores = {
      id: "1",
      gerenteCire: 0.5,
      supervisorAtivo: 0,
      supervisorReceptivo: 0,
      supervisorFranquia: 0,
      supervisorAtendimento: 0,
      gerenteAtendimento: 0,
      supervisorComercial: 0,
      itens: [{ id: "i1", nome: "Supervisão Nova", percentual: 0.2, ordem: 1 }],
    };
    expect(regras.itens[0].nome).toBe("Supervisão Nova");
  });
});
