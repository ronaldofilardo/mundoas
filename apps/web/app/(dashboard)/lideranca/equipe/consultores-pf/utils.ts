/**
 * Utilitários puros da página /lideranca/equipe/consultores-pf.
 * Extraídos para permitir testes sem dependência de React/@testing-library.
 */

export const MESES_ANO = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Fev" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Abr" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Ago" },
  { value: "09", label: "Set" },
  { value: "10", label: "Out" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dez" },
] as const;

export type MesValue = (typeof MESES_ANO)[number]["value"];

/**
 * Compõe o mesReferencia (YYYY-MM) a partir do ano e do mês (01-12).
 */
export function composeMesReferencia(ano: number, mes: MesValue): string {
  return `${ano}-${mes}`;
}

/**
 * Resultado da validação do valor da meta.
 */
export type ValidarValorMetaResultado =
  | { ok: true; valor: number }
  | { ok: false; motivo: "vazio" | "nan" | "negativo" };

/**
 * Valida uma string vinda do input e retorna o número ou um motivo de erro.
 * - "" → { ok: false, motivo: "vazio" } (não deve disparar POST)
 * - "abc" → { ok: false, motivo: "nan" }
 * - "-5" → { ok: false, motivo: "negativo" }
 * - "100" → { ok: true, valor: 100 }
 * - "100.50" → { ok: true, valor: 100.5 }
 */
export function validarValorMeta(raw: string): ValidarValorMetaResultado {
  if (raw === "") return { ok: false, motivo: "vazio" };
  const num = Number(raw);
  if (!Number.isFinite(num)) return { ok: false, motivo: "nan" };
  if (num < 0) return { ok: false, motivo: "negativo" };
  return { ok: true, valor: num };
}

/**
 * Payload enviado ao POST /api/v1/lideranca/consultores-pf/[id]/metas
 */
export interface SalvarMetaPayload {
  mesReferencia: string;
  valorMeta: number;
}

/**
 * Resultado normalizado do POST de salvamento de meta.
 */
export type SalvarMetaResultado =
  | { ok: true }
  | { ok: false; status: number; mensagem: string };

/**
 * Persiste uma meta mensal no backend. Função pura que recebe um fetch
 * injetável, permitindo testes sem rede e sem mockar global.fetch.
 *
 * - NÃO recarrega metas após sucesso (comportamento crítico para
 *   preservar o valor digitado e o foco do usuário).
 */
export async function salvarMeta(
  fetchFn: typeof fetch,
  consultorId: string,
  payload: SalvarMetaPayload,
): Promise<SalvarMetaResultado> {
  const url = `/api/v1/lideranca/consultores-pf/${consultorId}/metas`;
  try {
    const res = await fetchFn(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      let mensagem = "Erro ao salvar meta";
      try {
        const err = await res.json();
        if (err?.error) mensagem = err.error;
      } catch {
        // corpo não era JSON - mantém mensagem padrão
      }
      return { ok: false, status: res.status, mensagem };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 0, mensagem: "Erro ao salvar meta" };
  }
}

/**
 * Handler de alto nível: recebe o valor do input, valida e, se válido,
 * dispara o POST. Retorna se algo foi enviado.
 */
export async function tentarSalvarMeta(
  fetchFn: typeof fetch,
  consultorId: string,
  mesReferencia: string,
  rawValor: string,
): Promise<{ enviado: boolean }> {
  const validacao = validarValorMeta(rawValor);
  if (!validacao.ok) {
    if (validacao.motivo === "vazio") return { enviado: false };
    return { enviado: false };
  }
  const resultado = await salvarMeta(fetchFn, consultorId, {
    mesReferencia,
    valorMeta: validacao.valor,
  });
  return { enviado: resultado.ok };
}

/**
 * Formata um CPF de 11 dígitos para XXX.XXX.XXX-XX.
 */
export function formatarCpf(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Formata uma data ISO para pt-BR (dd/mm/aaaa).
 */
export function formatarData(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

/**
 * Normaliza o payload retornado por GET /api/v1/lideranca/consultores-pf/[id]/metas.
 * O endpoint pode retornar `{ metas: [...] }` ou um array direto.
 */
export interface MetaResposta {
  id: string;
  consultorPfId: string;
  mesReferencia: string;
  valorMeta: string | number;
}

function isMetaResposta(value: unknown): value is MetaResposta {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string"
    && typeof item.consultorPfId === "string"
    && typeof item.mesReferencia === "string"
    && (typeof item.valorMeta === "string" || typeof item.valorMeta === "number");
}

export function normalizarRespostaMetas(data: unknown): MetaResposta[] {
  if (Array.isArray(data)) return data.filter(isMetaResposta);
  if (!data || typeof data !== "object") return [];
  const metas = (data as Record<string, unknown>).metas;
  return Array.isArray(metas) ? metas.filter(isMetaResposta) : [];
}
