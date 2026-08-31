"use client";

import { useEffect, useState } from "react";
import type { Comercial } from "../types";

interface ComercialModalProps {
  comercial: Comercial;
  onSave: (data: Comercial) => void;
  onClose: () => void;
}

export function ComercialModal({ comercial, onSave, onClose }: ComercialModalProps) {
  const [formData, setFormData] = useState<Comercial>({
    ...comercial,
    telefone: comercial.telefone || "",
    funcao: comercial.funcao || "",
    lideranca: comercial.lideranca || comercial.tipoLideranca,
    tipo: comercial.tipo,
  });

  const liderancaInicial = comercial.lideranca || comercial.tipoLideranca || "";
  const [isLideranca, setIsLideranca] = useState<boolean>(!!liderancaInicial);
  const [tipoLideranca, setTipoLideranca] = useState<string>(liderancaInicial);
  const [tipo, setTipo] = useState<string>(comercial.tipo || "");
  const [funcoes, setFuncoes] = useState<string[]>([]);
  const [loadingFuncoes, setLoadingFuncoes] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!tipoLideranca) {
      setFuncoes([]);
      return;
    }

    async function carregarFuncoes() {
      setLoadingFuncoes(true);
      try {
        const endpoint = tipoLideranca === "COMERCIAL"
          ? "/api/v1/backoffice/regras-comerciais"
          : "/api/v1/backoffice/regras-gestores";
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("Não foi possível carregar as funções da regra");

        const data = await res.json() as { itens?: Array<{ nome?: unknown }> };
        const nomes = (data.itens ?? [])
          .map((item) => typeof item.nome === "string" ? item.nome.trim() : "")
          .filter(Boolean);

        if (!cancelled) setFuncoes(Array.from(new Set(nomes)));
      } catch {
        if (!cancelled) {
          setFuncoes([]);
        }
      } finally {
        if (!cancelled) setLoadingFuncoes(false);
      }
    }

    setFuncao("");
    void carregarFuncoes();

    return () => {
      cancelled = true;
    };
  }, [tipoLideranca]);

  function setFuncao(value: string) {
    setFormData((prev) => ({ ...prev, funcao: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(formData);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Editar Comercial</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nome">
              Nome
            </label>
            <input id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cpf">
              CPF
            </label>
            <input id="cpf"
              type="text"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lideranca-2">
              Telefone
            </label>
            <input id="lideranca-2"
              type="tel"
              value={formData.telefone || ""}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="lideranca"
              checked={isLideranca}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsLideranca(checked);
                if (!checked) {
                  setFormData({ 
                    ...formData, 
                    lideranca: undefined, 
                    funcao: "" 
                  });
                  setTipoLideranca("");
                }
              }}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="lideranca" className="text-sm font-medium text-gray-700">
              Liderança (opcional)
            </label>
          </div>

          {isLideranca && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lideranca-3">
                Tipo de Liderança
              </label>
              <select id="lideranca"
                value={tipoLideranca}
                onChange={(e) => {
                  setTipoLideranca(e.target.value);
                  setFormData({ 
                    ...formData, 
                    lideranca: e.target.value as "COMERCIAL" | "GESTOR",
                    funcao: "",
                    tipo: undefined
                  });
                }}
                className="w-full px-3 py-2 border rounded"
                required={isLideranca}
              >
                <option value="">Selecione</option>
                <option value="COMERCIAL">Comercial</option>
                <option value="GESTOR">Gestor</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tipo">
              Tipo
            </label>
            <select id="tipo"
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                setFormData({ ...formData, tipo: e.target.value as "GERENTE" | "SUPERVISOR" | "LIDER" | undefined });
              }}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Selecione</option>
              <option value="GERENTE">Gerente</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="LIDER">Lider</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="f">
              Função
            </label>
              <select id="f"
                value={formData.funcao || ""}
                onChange={(e) => setFuncao(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                disabled={!isLideranca || !tipoLideranca || loadingFuncoes}
              >
                <option value="">
                  {loadingFuncoes ? "Carregando..." : "Selecione"}
                </option>
                {funcoes.map((f) => (
                  <option key={f} value={f}>{f.replace(/_/g, " ")}</option>
                ))}
              </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">
              Status
            </label>
            <select id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
