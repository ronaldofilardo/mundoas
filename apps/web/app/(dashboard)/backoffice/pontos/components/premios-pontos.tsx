"use client";

import { useState } from "react";

interface Premio {
  id: string;
  codigo: string;
  tipo: string;
  descricao: string;
  custoPontos: number;
  ativo: boolean;
}

export function PremiosPontos({ data }: { data?: Premio[] }) {
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [custoPontos, setCustoPontos] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const url = editId ? `/api/v1/backoffice/pontos/premios?id=${editId}` : "/api/v1/backoffice/pontos/premios";
      const method = editId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo,
          tipo,
          descricao,
          custoPontos: Number(custoPontos),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Erro ao salvar prêmio");
      }

      setMessage({ type: "success", text: editId ? "Prêmio atualizado com sucesso!" : "Prêmio cadastrado com sucesso!" });
      setCodigo("");
      setTipo("");
      setDescricao("");
      setCustoPontos("");
      setEditId(null);
      window.location.reload();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao salvar prêmio" });
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
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setCodigo("");
    setTipo("");
    setDescricao("");
    setCustoPontos("");
  };

  const handleDelete = async (premio: Premio) => {
    if (!confirm(`Excluir prêmio ${premio.codigo}?`)) return;

    try {
      const response = await fetch(`/api/v1/backoffice/pontos/premios?id=${premio.id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Erro ao excluir prêmio");
      }
      setMessage({ type: "success", text: "Prêmio excluído com sucesso!" });
      window.location.reload();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao excluir prêmio" });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Prêmios</h2>

      <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">{editId ? "Editar Prêmio" : "Cadastrar Prêmio"}</h3>

        {message && (
          <div className={`mb-4 p-3 rounded ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="premio-codigo" className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input
              id="premio-codigo"
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label htmlFor="premio-tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              id="premio-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Selecione...</option>
              <option value="PRODUTO">Produto</option>
              <option value="SERVICO">Serviço</option>
              <option value="EXPERIENCIA">Experiência</option>
              <option value="VOUCHER">Voucher</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="premio-descricao" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea
            id="premio-descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="premio-custo-pontos" className="block text-sm font-medium text-gray-700 mb-1">Custo em Pontos</label>
          <input
            id="premio-custo-pontos"
            type="number"
            value={custoPontos}
            onChange={(e) => setCustoPontos(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="1"
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (editId ? "Atualizando..." : "Cadastrando...") : editId ? "Atualizar Prêmio" : "Cadastrar Prêmio"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">CÓDIGO</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">TIPO</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">DESCRIÇÃO</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">PONTOS</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {!data || data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                  Nenhum prêmio cadastrado
                </td>
              </tr>
            ) : (
              data.map((premio) => (
                <tr key={premio.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{premio.codigo}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{premio.tipo}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{premio.descricao}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{premio.custoPontos}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(premio)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(premio)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
