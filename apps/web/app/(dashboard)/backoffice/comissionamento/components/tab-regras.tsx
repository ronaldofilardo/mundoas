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
      setRegrasComerciais(regrasComRes.ok ? await regrasComRes.json() : null);
      setRegrasGestores(regrasGesRes.ok ? await regrasGesRes.json() : null);
    } catch {
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
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar regras comerciais");
        return;
      }
      toast.success("Regras comerciais salvas com sucesso");
      fetchRegras();
    } catch {
      toast.error("Erro ao salvar regras comerciais");
    }
  }

  async function handleSalvarGestores(data: RegrasGestores) {
    try {
      const res = await fetch("/api/v1/backoffice/regras-gestores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar regras de gestores");
        return;
      }
      toast.success("Regras de gestores salvas com sucesso");
      fetchRegras();
    } catch {
      toast.error("Erro ao salvar regras de gestores");
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
        {loading || !regrasComerciais ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : (
          <RegrasComerciaisForm
            regras={regrasComerciais}
            onSave={handleSalvarComerciais}
          />
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Regras: Gestores
        </h2>
        {loading || !regrasGestores ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : (
          <RegrasGestoresForm
            regras={regrasGestores}
            onSave={handleSalvarGestores}
          />
        )}
      </div>
    </div>
  );
}
