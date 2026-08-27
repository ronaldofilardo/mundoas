"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { CicloPontosItem } from "../pontos-types";

type CicloFormProps = {
  ciclo?: CicloPontosItem | null;
  onSaved?: () => void;
  onCancel?: () => void;
};

function toDateInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export function CriarCicloForm({ ciclo, onSaved, onCancel }: CicloFormProps) {
  const editando = Boolean(ciclo);
  const [nome, setNome] = useState("");
  const [inicio, setInicio] = useState("");
  const [fimAcumulo, setFimAcumulo] = useState("");
  const [fimResgate, setFimResgate] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setNome(ciclo?.nome ?? "");
    setInicio(toDateInput(ciclo?.inicioAcumuloEm));
    setFimAcumulo(toDateInput(ciclo?.fimAcumuloEm));
    setFimResgate(toDateInput(ciclo?.fimResgateEm));
  }, [ciclo]);

  async function handleSalvar() {
    if (!nome.trim() || !inicio || !fimAcumulo || !fimResgate) {
      toast.error("Preencha nome, início, fim do acúmulo e fim do resgate");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome: nome.trim(),
        inicioAcumuloEm: new Date(`${inicio}T00:00:00`).toISOString(),
        fimAcumuloEm: new Date(`${fimAcumulo}T00:00:00`).toISOString(),
        fimResgateEm: new Date(`${fimResgate}T00:00:00`).toISOString(),
      };

      const res = await fetch(
        editando
          ? `/api/v1/backoffice/pontos/ciclos/${ciclo!.id}`
          : "/api/v1/backoffice/pontos/ciclos",
        {
          method: editando ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar ciclo");

      toast.success(editando ? "Ciclo atualizado com sucesso!" : "Ciclo criado com sucesso!");
      onSaved?.();
      if (!editando) {
        setNome("");
        setInicio("");
        setFimAcumulo("");
        setFimResgate("");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar ciclo");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">
          {editando ? "Editar ciclo" : "Criar novo ciclo"}
        </h3>
        {editando && (
          <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">
            Cancelar
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1" htmlFor="nome">Nome</label>
          <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ex: Ciclo 2026" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1" htmlFor="inicio">Início</label>
          <input id="inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1" htmlFor="fimAcumulo">Fim do acúmulo</label>
          <input id="fimAcumulo" type="date" value={fimAcumulo} onChange={(e) => setFimAcumulo(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="md:col-span-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
          O resgate começa automaticamente no primeiro dia do ciclo e permanece disponível até o fim do resgate.
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1" htmlFor="fimResgate">Fim do resgate</label>
          <input id="fimResgate" type="date" value={fimResgate} onChange={(e) => setFimResgate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>
      <button type="button" onClick={handleSalvar} disabled={salvando} className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
        {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Criar ciclo"}
      </button>
    </div>
  );
}
