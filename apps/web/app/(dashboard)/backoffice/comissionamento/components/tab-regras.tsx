"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { RegrasComerciais, RegrasGestores } from "../../usuarios/comerciais/types";

const REGRAS_COMERCIAL_LABELS: Record<keyof RegrasComerciais, string> = {
  cartaoAcessoSaude: "Cartão Acesso Saúde",
  cireAtivo: "Cire Ativo",
  cireReceptivo: "Cire Receptivo",
  franchisingAcesso: "Franchising Acesso",
  franchisingCartao: "Franchising Cartão",
  unidade: "Unidade",
};

const REGRAS_GESTORES_LABELS: Record<keyof RegrasGestores, string> = {
  gerenteCire: "Gerente Cire",
  supervisorAtivo: "Supervisor Ativo",
  supervisorReceptivo: "Supervisor Receptivo",
  supervisorFranquia: "Supervisor Franquia",
  supervisorAtendimento: "Supervisor Atendimento",
  gerenteAtendimento: "Gerente Atendimento",
  supervisorComercial: "Supervisor Comercial",
};

export function TabRegras() {
  const [regrasComerciais, setRegrasComerciais] = useState<RegrasComerciais | null>(null);
  const [regrasGestores, setRegrasGestores] = useState<RegrasGestores | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchRegras() {
    setLoading(true);
    try {
      const [regrasComRes, regrasGesRes] = await Promise.all([
        fetch("/api/v1/backoffice/regras-comerciais"),
        fetch("/api/v1/backoffice/regras-gestores"),
      ]);
      const regrasComData: RegrasComerciais = regrasComRes.ok
        ? await regrasComRes.json()
        : {
            cartaoAcessoSaude: 0,
            cireAtivo: 0,
            cireReceptivo: 0,
            franchisingAcesso: 0,
            franchisingCartao: 0,
            unidade: 0,
          };
      const regrasGesData: RegrasGestores = regrasGesRes.ok
        ? await regrasGesRes.json()
        : {
            gerenteCire: 0,
            supervisorAtivo: 0,
            supervisorReceptivo: 0,
            supervisorFranquia: 0,
            supervisorAtendimento: 0,
            gerenteAtendimento: 0,
            supervisorComercial: 0,
          };
      setRegrasComerciais(regrasComData);
      setRegrasGestores(regrasGesData);
      if (!regrasComRes.ok || !regrasGesRes.ok) {
        toast.error("Erro ao carregar regras");
      }
    } catch {
      setRegrasComerciais({
        cartaoAcessoSaude: 0,
        cireAtivo: 0,
        cireReceptivo: 0,
        franchisingAcesso: 0,
        franchisingCartao: 0,
        unidade: 0,
      });
      setRegrasGestores({
        gerenteCire: 0,
        supervisorAtivo: 0,
        supervisorReceptivo: 0,
        supervisorFranquia: 0,
        supervisorAtendimento: 0,
        gerenteAtendimento: 0,
        supervisorComercial: 0,
      });
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
      try {
        errData = await res.json();
      } catch {
        // ignore json parse error
      }
      if (!res.ok) {
        const msg = errData.error || `Erro ${res.status}: ${res.statusText}`;
        toast.error(msg);
        return;
      }
      toast.success("Regras comerciais salvas com sucesso");
      fetchRegras();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar regras comerciais";
      toast.error(msg);
    }
  }

  async function handleSalvarGestores(data: RegrasGestores) {
    try {
      const res = await fetch("/api/v1/backoffice/regras-gestores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      let errData: { error?: string } = {};
      try {
        errData = await res.json();
      } catch {
        // ignore json parse error
      }
      if (!res.ok) {
        const msg = errData.error || `Erro ${res.status}: ${res.statusText}`;
        toast.error(msg);
        return;
      }
      toast.success("Regras de gestores salvas com sucesso");
      fetchRegras();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar regras de gestores";
      toast.error(msg);
    }
  }

  useEffect(() => {
    fetchRegras();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">💼</span>
          <h2 className="text-lg font-semibold text-gray-800">
            Regras: Consultores
          </h2>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : (
          <div className="space-y-3">
            {(Object.keys(REGRAS_COMERCIAL_LABELS) as Array<keyof RegrasComerciais>).map(
              (key) => (
                <RegraCard
                  key={key}
                  label={REGRAS_COMERCIAL_LABELS[key]}
                  value={regrasComerciais?.[key] ?? 0}
                  onChange={(val) => {
                    const num = parseFloat(val) || 0;
                    setRegrasComerciais((prev) => (prev ? { ...prev, [key]: num } : prev));
                  }}
                />
              )
            )}
            <button
              type="button"
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              onClick={() => regrasComerciais && handleSalvarComerciais(regrasComerciais)}
            >
              Salvar Regras
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">👤</span>
          <h2 className="text-lg font-semibold text-gray-800">
            Regras: Líderes/Supervisores
          </h2>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : (
          <div className="space-y-3">
            {(Object.keys(REGRAS_GESTORES_LABELS) as Array<keyof RegrasGestores>).map(
              (key) => (
                <RegraCard
                  key={key}
                  label={REGRAS_GESTORES_LABELS[key]}
                  value={regrasGestores?.[key] ?? 0}
                  onChange={(val) => {
                    const num = parseFloat(val) || 0;
                    setRegrasGestores((prev) => (prev ? { ...prev, [key]: num } : prev));
                  }}
                />
              )
            )}
            <button
              type="button"
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              onClick={() => regrasGestores && handleSalvarGestores(regrasGestores)}
            >
              Salvar Regras
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface RegraCardProps {
  label: string;
  value: number;
  onChange: (value: string) => void;
}

function RegraCard({ label, value, onChange }: RegraCardProps) {
  return (
    <div className="rounded border border-gray-200 bg-gray-50 p-3">
      <p className="text-sm text-gray-800">{label}</p>
      <p className="text-xs text-gray-500 mt-1">Taxa: {value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</p>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full px-3 py-2 border rounded text-sm"
      />
    </div>
  );
}
