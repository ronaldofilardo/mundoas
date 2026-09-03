"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { RegrasComerciais, RegrasGestores, RegrasFaltas, RegraItem } from "../../usuarios/comerciais/types";

type RegraState = RegrasComerciais | RegrasGestores | RegrasFaltas;

async function fetchRegrasByType(type: "comerciais" | "gestores" | "faltas"): Promise<RegraState | null> {
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

export function TabRegras() {
  const [regrasComerciais, setRegrasComerciais] = useState<RegrasComerciais | null>(null);
  const [regrasGestores, setRegrasGestores] = useState<RegrasGestores | null>(null);
  const [regrasFaltas, setRegrasFaltas] = useState<RegrasFaltas | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; itemId?: string; itemName?: string; title: string } | null>(null);
  const [newRule, setNewRule] = useState<Record<string, { nome: string; percentual: string }>>({});

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

  async function handleExcluirItem(type: "comerciais" | "gestores" | "faltas", itemId: string) {
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
    percentual: number,
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

  function openDeleteItemConfirm(type: "comerciais" | "gestores" | "faltas", itemId: string, itemName: string) {
    const titles = { comerciais: "Regras: Consultores", gestores: "Regras: Líderes/Supervisores", faltas: "Regras: Faltas" };
    setDeleteConfirm({ type, itemId, itemName, title: titles[type] });
  }

  useEffect(() => { fetchRegras(); }, []);

  const renderCustomRules = (
    regras: RegraState | null,
    type: "comerciais" | "gestores" | "faltas"
  ) => (
    <div className="space-y-3">
      {(regras?.itens || []).map((item: RegraItem) => (
        <RegraCard
          key={item.id}
          label={item.nome}
          value={item.percentual}
          onChange={(val) => {
            const num = parseFloat(val) || 0;
            handleEditarPercentual(type, item.id, num);
          }}
          onDelete={() => openDeleteItemConfirm(type, item.id, item.nome)}
        />
      ))}
      {(regras?.itens || []).length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Nenhuma regra personalizada criada. Use o formulário abaixo para adicionar.
        </p>
      )}
    </div>
  );

  const renderSection = (
    title: string,
    icon: string,
    regras: RegraState | null,
    type: "comerciais" | "gestores" | "faltas"
  ) => (
    <div className="card">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
        <span className="text-xs text-gray-500">
          {(regras?.itens || []).length} {(regras?.itens || []).length === 1 ? "regra" : "regras"}
        </span>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {renderCustomRules(regras, type)}
          <div className="rounded border border-primary-200 bg-primary-50 p-3 space-y-3">
            <p className="text-sm font-medium text-primary-800">Nova Regra Personalizada</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nome da regra (ex: Venda Direta)"
                value={newRule[type]?.nome ?? ""}
                onChange={(e) => updateNewRule(type, { nome: e.target.value })}
                className="px-3 py-2 border rounded text-sm"
              />
              <input
                type="number"
                step="0.0001"
                placeholder="Percentual (%)"
                value={newRule[type]?.percentual ?? ""}
                onChange={(e) => updateNewRule(type, { percentual: e.target.value })}
                className="px-3 py-2 border rounded text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                onClick={() => clearNewRule(type)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                onClick={() => handleNovaRegra(type)}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {renderSection("Regras: Consultores", "💼", regrasComerciais, "comerciais")}
        {renderSection("Regras: Líderes/Supervisores", "👤", regrasGestores, "gestores")}
        {renderSection("Regras: Faltas", "📋", regrasFaltas, "faltas")}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Excluir item "{deleteConfirm.itemName}"?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Esta ação removerá permanentemente esta regra personalizada.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Tem certeza que deseja prosseguir?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => handleExcluirItem(deleteConfirm.type as "comerciais" | "gestores" | "faltas", deleteConfirm.itemId!)}
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface RegraCardProps {
  label: string;
  value: number;
  onChange: (value: string) => void;
  onDelete?: () => void;
}

function RegraCard({ label, value, onChange, onDelete }: RegraCardProps) {
  return (
    <div className="rounded border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-800">{label}</p>
        {onDelete && (
          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            onClick={onDelete}
            title="Excluir"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">Taxa: {value.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}%</p>
      <input
        type="number"
        step="0.0001"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full px-3 py-2 border rounded text-sm"
      />
    </div>
  );
}
