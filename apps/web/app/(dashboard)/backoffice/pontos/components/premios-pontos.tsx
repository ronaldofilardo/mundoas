"use client";

import { useState } from "react";

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

export function PremiosPontos({ data }: { data?: Premio[] }) {
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [custoPontos, setCustoPontos] = useState("");
  const [prazoEntregaDias, setPrazoEntregaDias] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const limparFormulario = () => {
    setCodigo("");
    setTipo("");
    setDescricao("");
    setCustoPontos("");
    setPrazoEntregaDias("");
    setEditId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const prazo = Number(prazoEntregaDias);
      if (!Number.isInteger(prazo) || prazo < 0) {
        throw new Error("Informe um prazo de entrega inteiro e não negativo");
      }

      const url = editId
        ? `/api/v1/backoffice/pontos/premios?id=${editId}`
        : "/api/v1/backoffice/pontos/premios";
      const response = await fetch(url, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: codigo.trim(),
          tipo,
          descricao: descricao.trim(),
          custoPontos: Number(custoPontos),
          prazoEntregaDias: prazo,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || result.error || "Erro ao salvar prêmio");

      setMessage({
        type: "success",
        text: editId ? "Prêmio atualizado com sucesso!" : "Prêmio cadastrado com sucesso!",
      });
      limparFormulario();
      window.location.reload();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao salvar prêmio",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (premio: Premio) => {
    setEditId(premio.id);
    setCodigo(premio.codigo);
    setTipo(premio.tipo);
    setDescricao(premio.descricao);
    setCustoPontos(String(premio.custoPontos));
    setPrazoEntregaDias(String(premio.prazoEntregaDias ?? 0));
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (premio: Premio) => {
    if (!confirm(`Excluir prêmio ${premio.codigo}?`)) return;

    try {
      const response = await fetch(`/api/v1/backoffice/pontos/premios?id=${premio.id}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || result.error || "Erro ao excluir prêmio");
      setMessage({ type: "success", text: "Prêmio excluído com sucesso!" });
      window.location.reload();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao excluir prêmio",
      });
    }
  };

  return (
    <section aria-labelledby="premios-title" className="space-y-6">
      <div>
        <h2 id="premios-title" className="text-2xl font-bold text-gray-900">Prêmios</h2>
        <p className="mt-1 text-sm text-gray-500">Cadastre os prêmios disponíveis para troca de pontos.</p>
      </div>

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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {[
                  "CÓDIGO",
                  "TIPO",
                  "DESCRIÇÃO",
                  "PONTOS",
                  "PRAZO",
                  "AÇÕES",
                ].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!data || data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">Nenhum prêmio cadastrado</td>
                </tr>
              ) : data.map((premio) => (
                <tr key={premio.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-900">{premio.codigo}</td>
                  <td className="px-4 py-4 text-sm">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {tipoLabels[premio.tipo] ?? premio.tipo}
                    </span>
                  </td>
                  <td className="max-w-[320px] px-4 py-4 text-sm text-gray-700">{premio.descricao}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900">{premio.custoPontos}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{premio.prazoEntregaDias ?? 0} dias</td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex gap-3">
                      <button type="button" onClick={() => handleEdit(premio)} className="font-medium text-blue-600 hover:text-blue-800">Editar</button>
                      <button type="button" onClick={() => handleDelete(premio)} className="font-medium text-red-600 hover:text-red-800">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
