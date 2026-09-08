// Backward-compatible barrel: re-exports everything from new modular files.
// This ensures all existing imports (e.g. "@/lib/pontos-utils") continue working without changes.

export { creditarBonusConsultorPfPorProducao } from "./pontos/saldo";
export * from "./pontos/configuracao";
export * from "./pontos/ciclo";
export * from "./pontos/saldo";
export * from "./pontos/comissao-comercial";
export * from "./pontos/comissao-consultor-pf";
export * from "./cpf-utils";
export { competenciaDaData } from "./normalizacao";