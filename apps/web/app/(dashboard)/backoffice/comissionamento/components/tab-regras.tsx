"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { RegrasComerciais, RegrasGestores } from "../../usuarios/comerciais/types";
import { RegrasComerciaisForm } from "../../usuarios/comerciais/components/regras-comerciais-form";
import { RegrasGestoresForm } from "../../usuarios/comerciais/components/regras-gestores-form";

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
      } catch { }
      if (!res.ok) {
        const msg = errData.error || `Erro ${res.status}: ${res.statusText}`;
        console.error("[TabRegras] Erro ao salvar regras comerciais:", msg, errData);
        toast.error(msg);
        alert(msg);
        return;
      }
      toast.success("Regras comerciais salvas com sucesso");
      fetchRegras();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar regras comerciais";
      console.error("[TabRegras] Exceção ao salvar regras comerciais:", err);
      toast.error(msg);
      alert(msg);
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
      } catch { }
      if (!res.ok) {
        const msg = errData.error || `Erro ${res.status}: ${res.statusText}`;
        console.error("[TabRegras] Erro ao salvar regras de gestores:", msg, errData);
        toast.error(msg);
        alert(msg);
        return;
      }
      toast.success("Regras de gestores salvas com sucesso");
      fetchRegras();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar regras de gestores";
      console.error("[TabRegras] Exceção ao salvar regras de gestores:", err);
      toast.error(msg);
      alert(msg);
    }
  }

  useEffect(() => {
    fetchRegras();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Regras: Comercial
        </h2>
        {loading ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : (
          <RegrasComerciaisForm
            regras={regrasComerciais!}
            onSave={handleSalvarComerciais}
          />
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Regras: Gestores
        </h2>
        {loading ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : (
          <RegrasGestoresForm
            regras={regrasGestores!}
            onSave={handleSalvarGestores}
          />
        )}
      </div>
    </div>
  );
}
