import type { RegrasComerciais, RegrasGestores } from "../app/(dashboard)/backoffice/usuarios/comerciais/types";

const REGRAS_GESTOR_MAP: Record<string, keyof RegrasGestores> = {
  "GERENTE CIRE": "gerenteCire",
  "SUPERVISOR ATIVO": "supervisorAtivo",
  "SUPERVISOR RECEPTIVO": "supervisorReceptivo",
  "SUPERVISOR FRANQUIA": "supervisorFranquia",
  "SUPERVISOR ATENDIMENTO": "supervisorAtendimento",
  "GERENTE ATENDIMENTO": "gerenteAtendimento",
  "SUPERVISOR COMERCIAL": "supervisorComercial",
};

const REGRAS_COMERCIAL_MAP: Record<string, keyof RegrasComerciais> = {
  "CARTAO ACESSO SAUDE": "cartaoAcessoSaude",
  "CIRE ATIVO": "cireAtivo",
  "CIRE RECEPTIVO": "cireReceptivo",
  "FRANCHISING ACESSO": "franchisingAcesso",
  "FRANCHISING CARTAO": "franchisingCartao",
  "UNIDADE": "unidade",
};

export function parseMoedaParaNumero(valor: string | undefined): number {
  if (!valor) return 0;
  const semPontos = valor.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(semPontos);
  return isNaN(num) ? 0 : num;
}

export function getComissaoFromFuncao(
  regras: { regrasComerciais: RegrasComerciais | null; regrasGestores: RegrasGestores | null },
  funcao: string | undefined,
): number {
  const raw = (funcao || "").toUpperCase().replace(/_/g, " ").trim();
  const funcaoStripped = raw.replace(/\s*ATIVO\s*$/, "").replace(/\s*RECEPTIVO\s*$/, "").trim();

  const chaveGestor = REGRAS_GESTOR_MAP[funcaoStripped];
  if (chaveGestor && regras.regrasGestores) return Number(regras.regrasGestores[chaveGestor]);

  const chaveCom = REGRAS_COMERCIAL_MAP[funcaoStripped];
  if (chaveCom && regras.regrasComerciais) return Number(regras.regrasComerciais[chaveCom]);

  return 0;
}

/**
 * Calcula o valor em R$ da comissão para um comercial no mês.
 * Fórmula: producao × (regra / 100)
 * - producao: string formatada em moeda pt-BR (ex: "2.500,00")
 * - regra: percentual armazenado como fração (ex: 0.05 = 0,05%)
 */
export function calcularValorComissao(producao: string | undefined, regra: number): string {
  const producaoNum = parseMoedaParaNumero(producao);
  if (!producaoNum || !regra) return "";
  const valor = producaoNum * (regra / 100);
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Calcula o valor numérico da comissão (para persistência).
 * Mesma fórmula de calcularValorComissao, mas retorna número com 2 casas.
 */
export function calcularValorComissaoNum(producao: string | undefined, regra: number): number {
  const producaoNum = parseMoedaParaNumero(producao);
  if (!producaoNum || !regra) return 0;
  return Number((producaoNum * (regra / 100)).toFixed(2));
}
