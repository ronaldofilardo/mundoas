import { normalizarRespostaMetas } from "./utils";
import type { ConsultorPf, MetaConsultorPf } from "./types";

export type FetchImpl = typeof fetch;

export async function listarConsultores(
  fetchFn: FetchImpl,
): Promise<{ ok: true; data: ConsultorPf[] } | { ok: false; mensagem: string }> {
  try {
    const res = await fetchFn("/api/v1/lideranca/consultores-pf");
    if (!res.ok) return { ok: false, mensagem: "Erro ao carregar consultores" };
    const data = (await res.json()) as ConsultorPf[];
    return { ok: true, data };
  } catch {
    return { ok: false, mensagem: "Erro ao carregar consultores PF" };
  }
}

export async function listarSetores(
  fetchFn: FetchImpl,
): Promise<{ ok: true; data: string[] } | { ok: false; mensagem: string }> {
  try {
    const res = await fetchFn("/api/v1/setores?origem=regras-consultores");
    if (!res.ok) return { ok: false, mensagem: "Erro ao carregar setores da regra" };
    const data = (await res.json()) as Array<{ id: string; nome: string }>;
    return { ok: true, data: data.map((s) => s.nome) };
  } catch {
    return { ok: false, mensagem: "Não foi possível carregar os setores de Regras: Consultores" };
  }
}

export async function listarMetasConsultor(
  fetchFn: FetchImpl,
  consultorId: string,
): Promise<MetaConsultorPf[]> {
  try {
    const res = await fetchFn(`/api/v1/lideranca/consultores-pf/${consultorId}/metas`);
    const data = res.ok ? await res.json() : { metas: [] };
    return normalizarRespostaMetas(data) as MetaConsultorPf[];
  } catch {
    return [];
  }
}

export interface EditarConsultorPayload {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  setores: string[];
}

export async function atualizarConsultor(
  fetchFn: FetchImpl,
  consultorId: string,
  payload: EditarConsultorPayload,
): Promise<{ ok: true } | { ok: false; mensagem: string }> {
  try {
    const res = await fetchFn(`/api/v1/lideranca/consultores-pf/${consultorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, mensagem: data?.message || "Erro ao salvar" };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, mensagem: err instanceof Error ? err.message : "Erro ao salvar consultor" };
  }
}

export async function alternarStatusConsultor(
  fetchFn: FetchImpl,
  consultorId: string,
  status: string,
): Promise<{ ok: true } | { ok: false; mensagem: string }> {
  try {
    const res = await fetchFn(`/api/v1/lideranca/consultores-pf/${consultorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return { ok: false, mensagem: "Erro ao alterar status" };
    return { ok: true };
  } catch {
    return { ok: false, mensagem: "Erro ao alterar status do consultor" };
  }
}