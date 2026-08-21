"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { RegrasComerciais, RegrasGestores, RegrasFaltas, RegraItem } from "../../usuarios/comerciais/types";

type RegrasComerciaisKeys = Exclude<keyof RegrasComerciais, "id" | "itens">;
type RegrasGestoresKeys = Exclude<keyof RegrasGestores, "id" | "itens">;
type RegrasFaltasKeys = Exclude<keyof RegrasFaltas, "id" | "itens">;

const SISTEMA_COMERCIAL_LABELS: Record<RegrasComerciaisKeys, string> = {
  cartaoAcessoSaude: "Cartão Acesso Saúde",
  cireAtivo: "Cire Ativo",
  cireReceptivo: "Cire Receptivo",
  franchisingAcesso: "Franchising Acesso",
  franchisingCartao: "Franchising Cartão",
  unidade: "Unidade",
};

const SISTEMA_GESTORES_LABELS: Record<RegrasGestoresKeys, string> = {
  gerenteCire: "Gerente Cire",
  supervisorAtivo: "Supervisor Ativo",
  supervisorReceptivo: "Supervisor Receptivo",
  supervisorFranquia: "Supervisor Franquia",
  supervisorAtendimento: "Supervisor Atendimento",
  gerenteAtendimento: "Gerente Atendimento",
  supervisorComercial: "Supervisor Comercial",
};

const SISTEMA_FALTAS_LABELS: Record<RegrasFaltasKeys, string> = {
  consultorUnidadeComFalta: "Consultor Unidade (com falta)",
  consultorUnidadeSemFalta: "Consultor Unidade (sem falta)",
  supervisorAtendimentoComFalta: "Supervisor Atendimento (com falta)",
  supervisorAtendimentoSemFalta: "Supervisor Atendimento (sem falta)",
  gerenteComercialComFalta: "Gerente Comercial (com falta)",
  gerenteComercialSemFalta: "Gerente Comercial (sem falta)",
};

const SISTEMA_COMERCIAL_KEYS = Object.keys(SISTEMA_COMERCIAL_LABELS) as RegrasComerciaisKeys[];
const SISTEMA_GESTORES_KEYS = Object.keys(SISTEMA_GESTORES_LABELS) as RegrasGestoresKeys[];
const SISTEMA_FALTAS_KEYS = Object.keys(SISTEMA_FALTAS_LABELS) as RegrasFaltasKeys[];

export function TabRegras() {
  const [regrasComerciais, setRegrasComerciais] = useState<RegrasComerciais | null>(null);
  const [regrasGestores, setRegrasGestores] = useState<RegrasGestores | null>(null);
  const [regrasFaltas, setRegrasFaltas] = useState<RegrasFaltas | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; itemId?: string; itemName?: string; title: string } | null>(null);
  const [showNewRule, setShowNewRule] = useState<"comerciais" | "gestores" | "faltas" | null>(null);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRulePercentual, setNewRulePercentual] = useState("");

  async function fetchRegras() {
    setLoading(true);
    try {
      const [regrasComRes, regrasGesRes, regrasFaltasRes] = await Promise.all([
        fetch("/api/v1/backoffice/regras-comerciais"),
        fetch("/api/v1/backoffice/regras-gestores"),
        fetch("/api/v1/backoffice/regras-faltas"),
      ]);
      const regrasComData: RegrasComerciais = regrasComRes.ok
        ? await regrasComRes.json()
        : { cartaoAcessoSaude: 0, cireAtivo: 0, cireReceptivo: 0, franchisingAcesso: 0, franchisingCartao: 0, unidade: 0 };
      const regrasGesData: RegrasGestores = regrasGesRes.ok
        ? await regrasGesRes.json()
        : { gerenteCire: 0, supervisorAtivo: 0, supervisorReceptivo: 0, supervisorFranquia: 0, supervisorAtendimento: 0, gerenteAtendimento: 0, supervisorComercial: 0 };
      const regrasFaltasData: RegrasFaltas = regrasFaltasRes.ok
        ? await regrasFaltasRes.json()
        : { consultorUnidadeComFalta: 0, consultorUnidadeSemFalta: 0, supervisorAtendimentoComFalta: 0, supervisorAtendimentoSemFalta: 0, gerenteComercialComFalta: 0, gerenteComercialSemFalta: 0 };
      setRegrasComerciais(regrasComData);
      setRegrasGestores(regrasGesData);
      setRegrasFaltas(regrasFaltasData);
      if (!regrasComRes.ok || !regrasGesRes.ok || !regrasFaltasRes.ok) {
        toast.error("Erro ao carregar regras");
      }
    } catch {
      setRegrasComerciais({ cartaoAcessoSaude: 0, cireAtivo: 0, cireReceptivo: 0, franchisingAcesso: 0, franchisingCartao: 0, unidade: 0 });
      setRegrasGestores({ gerenteCire: 0, supervisorAtivo: 0, supervisorReceptivo: 0, supervisorFranquia: 0, supervisorAtendimento: 0, gerenteAtendimento: 0, supervisorComercial: 0 });
      setRegrasFaltas({ consultorUnidadeComFalta: 0, consultorUnidadeSemFalta: 0, supervisorAtendimentoComFalta: 0, supervisorAtendimentoSemFalta: 0, gerenteComercialComFalta: 0, gerenteComercialSemFalta: 0 });
      toast.error("Erro ao carregar regras");
    } finally {
      setLoading(false);
    }
  }

  async function handleSalvarComerciais(data: RegrasComerciais) {
    try {
      const res = await fetch("/api/v1/backoffice/regras-comerciais", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      let errData: { error?: string } = {};
      try { errData = await res.json(); } catch {}
      if (!res.ok) { toast.error(errData.error || `Erro ${res.status}: ${res.statusText}`); return; }
      toast.success("Regras comerciais salvas com sucesso");
      fetchRegras();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao salvar regras comerciais"); }
  }

  async function handleSalvarGestores(data: RegrasGestores) {
    try {
      const res = await fetch("/api/v1/backoffice/regras-gestores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      let errData: { error?: string } = {};
      try { errData = await res.json(); } catch {}
      if (!res.ok) { toast.error(errData.error || `Erro ${res.status}: ${res.statusText}`); return; }
      toast.success("Regras de gestores salvas com sucesso");
      fetchRegras();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao salvar regras de gestores"); }
  }

  async function handleSalvarFaltas(data: RegrasFaltas) {
    try {
      const res = await fetch("/api/v1/backoffice/regras-faltas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      let errData: { error?: string } = {};
      try { errData = await res.json(); } catch {}
      if (!res.ok) { toast.error(errData.error || `Erro ${res.status}: ${res.statusText}`); return; }
      toast.success("Regras de faltas salvas com sucesso");
      fetchRegras();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao salvar regras de faltas"); }
  }

  async function handleExcluirItem(type: "comerciais" | "gestores" | "faltas", itemId: string) {
    if (itemId.startsWith("sistema-")) {
      toast.error("Não é possível excluir campos do sistema");
      setDeleteConfirm(null);
      return;
    }
    const endpoint = type === "comerciais" ? "/api/v1/backoffice/regras-comerciais"
      : type === "gestores" ? "/api/v1/backoffice/regras-gestores"
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
    if (!newRuleName.trim()) { toast.error("Nome é obrigatório"); return; }
    const percentual = parseFloat(newRulePercentual) || 0;

    const endpoint = type === "comerciais" ? "/api/v1/backoffice/regras-comerciais"
      : type === "gestores" ? "/api/v1/backoffice/regras-gestores"
      : "/api/v1/backoffice/regras-faltas";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: newRuleName.trim(), percentual }),
      });
      let errData: { error?: string } = {};
      try { errData = await res.json(); } catch {}
      if (!res.ok) { toast.error(errData.error || `Erro ${res.status}: ${res.statusText}`); return; }
      toast.success("Nova regra adicionada com sucesso");
      setShowNewRule(null);
      setNewRuleName("");
      setNewRulePercentual("");
      fetchRegras();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao adicionar regra"); }
  }

  function openDeleteItemConfirm(type: "comerciais" | "gestores" | "faltas", itemId: string, itemName: string) {
    const titles = { comerciais: "Regras: Consultores", gestores: "Regras: Líderes/Supervisores", faltas: "Regras: Faltas" };
    setDeleteConfirm({ type, itemId, itemName, title: titles[type] });
  }

  useEffect(() => { fetchRegras(); }, []);

  const renderSistemaFields = (
    labels: Record<string, string>,
    keys: Array<RegrasComerciaisKeys | RegrasGestoresKeys | RegrasFaltasKeys>,
    regras: any,
    setRegras: (prev: any) => any,
    type: "comerciais" | "gestores" | "faltas"
  ) => (
    <div className="space-y-3 border-t border-gray-200 pt-3">
      {keys.map((key) => (
        <RegraCard
          key={key}
          label={labels[key]}
          value={regras?.[key] ?? 0}
          onChange={(val) => {
            const num = parseFloat(val) || 0;
            setRegras((prev: any) => (prev ? { ...prev, [key]: num } : prev));
          }}
          onDelete={() => openDeleteItemConfirm(type, `sistema-${key}`, labels[key])}
        />
      ))}
    </div>
  );

  const renderCustomItems = (
    itens: RegraItem[] | undefined,
    type: "comerciais" | "gestores" | "faltas",
    setRegras: (prev: any) => any,
    handleSalvar: (data: any) => void,
    regras: any
  ) => {
    const items = itens || [];
    if (items.length === 0) return null;

    return (
      <div className="space-y-3 border-t border-gray-200 pt-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Regras Personalizadas</p>
        {items.map((item) => (
          <div key={item.id} className="rounded border border-gray-200 bg-gray-50 p-3 flex items-center gap-3">
            <input
              type="text"
              value={item.nome}
              readOnly
              className="w-40 px-3 py-2 border rounded text-sm bg-white text-gray-700"
            />
            <p className="text-xs text-gray-500 w-24">Taxa:</p>
            <input
              type="number"
              step="0.0001"
              value={item.percentual}
              onChange={(e) => {
                const num = parseFloat(e.target.value) || 0;
                setRegras((prev: any) => {
                  if (!prev) return prev;
                  const updatedItens = prev.itens?.map((i: RegraItem) =>
                    i.id === item.id ? { ...i, percentual: num } : i
                  );
                  return { ...prev, itens: updatedItens };
                });
              }}
              className="flex-1 px-3 py-2 border rounded text-sm"
            />
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              onClick={() => openDeleteItemConfirm(type, item.id, item.nome)}
              title="Excluir regra"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderSection = (
    title: string,
    icon: string,
    sistemaLabels: Record<string, string>,
    sistemaKeys: Array<RegrasComerciaisKeys | RegrasGestoresKeys | RegrasFaltasKeys>,
    regras: any,
    setRegras: (prev: any) => any,
    handleSalvar: (data: any) => void,
    type: "comerciais" | "gestores" | "faltas"
  ) => (
    <div className="card">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
            onClick={() => { setShowNewRule(type); setNewRuleName(""); setNewRulePercentual(""); }}
          >
            + Nova Regra
          </button>
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {renderSistemaFields(sistemaLabels, sistemaKeys, regras, setRegras, type)}
          {renderCustomItems(regras?.itens, type, setRegras, handleSalvar, regras)}
          {showNewRule === type && (
            <div className="rounded border border-primary-200 bg-primary-50 p-3 space-y-3">
              <p className="text-sm font-medium text-primary-800">Nova Regra Personalizada</p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nome da regra (ex: Venda Direta)"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="px-3 py-2 border rounded text-sm"
                  autoFocus
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Percentual (%)"
                  value={newRulePercentual}
                  onChange={(e) => setNewRulePercentual(e.target.value)}
                  className="px-3 py-2 border rounded text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => { setShowNewRule(null); setNewRuleName(""); setNewRulePercentual(""); }}
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
          )}
          {regras?.id && (
            <button
              type="button"
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 w-full"
              onClick={() => regras && handleSalvar(regras)}
            >
              Salvar Regras
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {renderSection(
          "Regras: Consultores",
          "💼",
          SISTEMA_COMERCIAL_LABELS,
          SISTEMA_COMERCIAL_KEYS,
          regrasComerciais,
          setRegrasComerciais,
          handleSalvarComerciais,
          "comerciais"
        )}
        {renderSection(
          "Regras: Líderes/Supervisores",
          "👤",
          SISTEMA_GESTORES_LABELS,
          SISTEMA_GESTORES_KEYS,
          regrasGestores,
          setRegrasGestores,
          handleSalvarGestores,
          "gestores"
        )}
        {renderSection(
          "Regras: Faltas",
          "📋",
          SISTEMA_FALTAS_LABELS,
          SISTEMA_FALTAS_KEYS,
          regrasFaltas,
          setRegrasFaltas,
          handleSalvarFaltas,
          "faltas"
        )}
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