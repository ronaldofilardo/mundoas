"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { RegrasComerciais, RegrasGestores, RegrasFaltas, RegraItem } from "@/app/(dashboard)/backoffice/usuarios/comerciais/types";

type RegraState = RegrasComerciais | RegrasGestores | RegrasFaltas;

async function fetchRegrasByType(
  type: "comerciais" | "gestores" | "faltas"
): Promise<RegraState | null> {
  const endpoint =
    type === "comerciais"
      ? "/api/v1/backoffice/regras-comerciais"
      : type === "gestores"
        ? "/api/v1/backoffice/regras-gestores"
        : "/api/v1/backoffice/regras-faltas";
  const res = await fetch(endpoint);
  if (!res.ok) return null;
  return (await res.json()) as RegraState;
}

export function useRegras() {
  const [regrasComerciais, setRegrasComerciais] = useState<RegrasComerciais | null>(null);
  const [regrasGestores, setRegrasGestores] = useState<RegrasGestores | null>(null);
  const [regrasFaltas, setRegrasFaltas] = useState<RegrasFaltas | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<
    { type: string; itemId?: string; itemName?: string; title: string } | null
  >(null);
  const [newRule, setNewRule] = useState<
    Record<string, { nome: string; percentual: string }>
  >({});

  function updateNewRule(type: string, patch: Partial<{ nome: string; percentual: string }>) {
    setNewRule((prev) => {
      const current = prev[type] ?? { nome: "", percentual: "" };
      return { ...prev, [type]: { ...current, ...patch } };
    });
  }

  function clearNewRule(type: string) {
    setNewRule((prev) => ({ ...prev, [type]: { nome: "", percentual: "" } }));
  }

  async function fetchRegras() {
    setLoading(true);
    try {
      const [com, ges, falt] = await Promise.all([
        fetchRegrasByType("comerciais"),
        fetchRegrasByType("gestores"),
        fetchRegrasByType("faltas"),
      ]);
      setRegrasComerciais(com);
      setRegrasGestores(ges);
      setRegrasFaltas(falt);
      if (!com || !ges || !falt) toast.error("Erro ao carregar regras");
    } catch {
      setRegrasComerciais(null);
      setRegrasGestores(null);
      setRegrasFaltas(null);
      toast.error("Não foi possível carregar as regras do Backoffice atual");
    } finally {
      setLoading(false);
    }
  }

  async function handleExcluirItem(
    type: "comerciais" | "gestores" | "faltas",
    itemId: string
  ) {
    const endpoint =
      type === "comerciais"
        ? "/api/v1/backoffice/regras-comerciais"
        : type === "gestores"
          ? "/api/v1/backoffice/regras-gestores"
          : "/api/v1/backoffice/regras-faltas";

    try {
      const res = await fetch(`${endpoint}?itemId=${itemId}`, { method: "DELETE" });
      let errData: { error?: string } = {};
      try { errData = await res.json(); } catch {}
      if (!res.ok) { toast.error(errData.error || `Erro ${res.status}: ${res.statusText}`); return; }
      toast.success("Item excluído com sucesso");
      fetchRegras();
      setDeleteConfirm(null);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao excluir item"); }
  }

  async function handleNovaRegra(type: "comerciais" | "gestores" | "faltas") {
    const draft = newRule[type] || { nome: "", percentual: "" };
    if (!draft.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    const percentual = parseFloat(draft.percentual) || 0;

    const endpoint =
      type === "comerciais"
        ? "/api/v1/backoffice/regras-comerciais"
        : type === "gestores"
          ? "/api/v1/backoffice/regras-gestores"
          : "/api/v1/backoffice/regras-faltas";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: draft.nome.trim(), percentual }),
      });
      let errData: { error?: string } = {};
      try { errData = await res.json(); } catch {}
      if (!res.ok) { toast.error(errData.error || `Erro ${res.status}: ${res.statusText}`); return; }
      toast.success("Nova regra adicionada com sucesso");
      clearNewRule(type);
      fetchRegras();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao adicionar regra"); }
  }

  async function handleEditarPercentual(
    type: "comerciais" | "gestores" | "faltas",
    itemId: string,
    percentual: number
  ) {
    const endpoint =
      type === "comerciais"
        ? "/api/v1/backoffice/regras-comerciais"
        : type === "gestores"
          ? "/api/v1/backoffice/regras-gestores"
          : "/api/v1/backoffice/regras-faltas";

    try {
      const res = await fetch(`${endpoint}?itemId=${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percentual }),
      });
      let errData: { error?: string } = {};
      try { errData = await res.json(); } catch {}
      if (!res.ok) { toast.error(errData.error || `Erro ${res.status}: ${res.statusText}`); return; }
      toast.success("Percentual atualizado");
      fetchRegras();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao atualizar percentual"); }
  }

  function openDeleteItemConfirm(
    type: "comerciais" | "gestores" | "faltas",
    itemId: string,
    itemName: string
  ) {
    const titles = {
      comerciais: "Regras: Consultores",
      gestores: "Regras: Líderes/Supervisores",
      faltas: "Regras: Faltas",
    };
    setDeleteConfirm({ type, itemId, itemName, title: titles[type] });
  }

  useEffect(() => { fetchRegras(); }, []);

  return {
    regrasComerciais,
    regrasGestores,
    regrasFaltas,
    loading,
    deleteConfirm,
    setDeleteConfirm,
    newRule,
    setNewRule,
    updateNewRule,
    clearNewRule,
    handleExcluirItem,
    handleNovaRegra,
    handleEditarPercentual,
    openDeleteItemConfirm,
  };
}