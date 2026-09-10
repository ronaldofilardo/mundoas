"use client";

import { useState } from "react";
import { usePremiosForm } from "@/components/backoffice/pontos/components/use-premios-form";
import { PremiosUpload } from "@/components/backoffice/premios-upload";

interface Premio {
  id: string;
  codigo: string;
  tipo: string;
  descricao: string;
  custoPontos: number;
  prazoEntregaDias: number;
  ativo: boolean;
}

const tipoLabels: Record<string, string> = {
  PRODUTO: "Produto",
  SERVICO: "Serviço",
  EXPERIENCIA: "Experiência",
  VOUCHER: "Voucher",
};

export function PremiosForm({ onSave, onEdit, onDelete, initialData, onUploadSuccess }: {
  onSave: (data: Omit<Premio, "id" | "ativo">) => Promise<void>;
  onEdit?: (premio: Premio) => void;
  onDelete?: (id: string) => Promise<void>;
  initialData?: Premio;
  onUploadSuccess?: () => void;
}) {
  const {
    codigo, setCodigo, tipo, setTipo, descricao, setDescricao,
    custoPontos, setCustoPontos, prazoEntregaDias, setPrazoEntregaDias,
    loading, message, editId, reloadKey, handleSubmit, handleEdit, handleDelete, limparFormulario,
  } = usePremiosForm({ initialData, onSave, onDelete, onEdit });

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            {editId ? "Editar Prêmio" : "Cadastrar Prêmio"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">Defina o custo e o prazo para entrega após a aprovação do resgate.</p>
        </div>
        {editId && (
          <button
            type="button"
            onClick={limparFormulario}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Cancelar edição
          </button>
        )}
      </div>

      {message && (
        <div
          role="status"
          className={`mb-5 rounded-lg border p-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm font-medium text-gray-700">
          Código
          <input
            id="premio-codigo"
            type="text"
            value={codigo}
            onChange={(event) => setCodigo(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            required
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Tipo
          <select
            id="premio-tipo"
            value={tipo}
            onChange={(event) => setTipo(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            required
          >
            <option value="">Selecione...</option>
            {Object.entries(tipoLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-gray-700">
          Custo em Pontos
          <input
            id="premio-custo-pontos"
            type="number"
            min="1"
            step="1"
            value={custoPontos}
            onChange={(event) => setCustoPontos(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            required
          />
        </label>

        <label className="text-sm font-semibold text-gray-800">
          Prazo de entrega
          <span className="mt-1 flex items-center rounded-lg border border-gray-300 bg-white focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100">
            <input
              id="premio-prazo-entrega"
              type="number"
              min="0"
              step="1"
              value={prazoEntregaDias}
              onChange={(event) => setPrazoEntregaDias(event.target.value)}
              className="w-full rounded-lg border-0 bg-transparent px-3 py-2.5 text-sm outline-none"
              aria-describedby="premio-prazo-ajuda"
              required
            />
            <span className="pr-3 text-xs text-gray-500">dias</span>
          </span>
          <span id="premio-prazo-ajuda" className="mt-1 block text-xs font-normal text-gray-500">
            Após a aprovação do resgate
          </span>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <label className="text-sm font-medium text-gray-700">
          Descrição
          <textarea
            id="premio-descricao"
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            className="mt-1 min-h-28 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (editId ? "Atualizando..." : "Cadastrando...") : editId ? "Atualizar Prêmio" : "Cadastrar Prêmio"}
        </button>
      </div>
    </form>
  );
}