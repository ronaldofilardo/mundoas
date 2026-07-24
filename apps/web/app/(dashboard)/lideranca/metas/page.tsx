"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MetaLideranca {
  id: string;
  mesReferencia: string;
  valorMeta: number;
  valorAtingido: number;
}

interface MembroMeta {
  tipo: "CONSULTOR_PF";
  id: string;
  nome: string;
  meta: MetaLideranca | null;
  totalParceiros: number;
}

export default function MetasPage() {
  const [metasLideranca, setMetasLideranca] = useState<MetaLideranca[]>([]);
  const [membros, setMembros] = useState<MembroMeta[]>([]);
  const [totais, setTotais] = useState({ consultoresPf: 0 });
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [valorMeta, setValorMeta] = useState("");

  useEffect(() => {
    fetchMetas();
  }, []);

  async function fetchMetas() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/lideranca/metas");
      if (!res.ok) throw new Error("Erro ao carregar metas");
      const data = await res.json();
      setMetasLideranca(data.lideranca.metas || []);
      setMembros(data.membros || []);
      setTotais(data.totais || {});
    } catch (error) {
      toast.error("Erro ao carregar metas");
    } finally {
      setLoading(false);
    }
  }

  async function salvarMeta(mesReferencia: string) {
    try {
      const res = await fetch("/api/v1/lideranca/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesReferencia,
          valorMeta: parseFloat(valorMeta),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar meta");
      }

      toast.success("Meta salva com sucesso");
      setEditando(null);
      setValorMeta("");
      fetchMetas();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar meta");
    }
  }

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function getMesReferencia() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  const metaAtual = metasLideranca.find(
    (m) => m.mesReferencia === getMesReferencia(),
  );

  return (
    <div className="font-sans space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Metas</h1>
        <p className="text-sm text-gray-500">
          Acompanhe as metas da liderança e da sua equipe
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Meta da Liderança (Mês Atual)</h3>
          {metaAtual ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Valor da Meta</span>
                <span className="text-lg font-bold text-green-600">
                  {formatarMoeda(Number(metaAtual.valorMeta))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Valor Atingido</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatarMoeda(Number(metaAtual.valorAtingido))}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma meta cadastrada para este mês</p>
          )}

          {editando === getMesReferencia() ? (
            <div className="mt-4 space-y-2">
              <input
                type="number"
                step="0.01"
                value={valorMeta}
                onChange={(e) => setValorMeta(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Valor da meta"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => salvarMeta(getMesReferencia())}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700"
                >
                  Salvar
                </button>
                <button
                  onClick={() => {
                    setEditando(null);
                    setValorMeta("");
                  }}
                  className="px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditando(getMesReferencia());
                setValorMeta(metaAtual ? String(metaAtual.valorMeta) : "");
              }}
              className="mt-4 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {metaAtual ? "Editar Meta" : "Cadastrar Meta"}
            </button>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Metas por Membro da Equipe</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-2 font-medium text-gray-600">Tipo</th>
                  <th className="text-left p-2 font-medium text-gray-600">Nome</th>
                  <th className="text-right p-2 font-medium text-gray-600">Meta</th>
                  <th className="text-right p-2 font-medium text-gray-600">Atingido</th>
                  <th className="text-center p-2 font-medium text-gray-600">Parceiros</th>
                </tr>
              </thead>
              <tbody>
                {membros.map((m) => (
                  <tr key={`${m.tipo}-${m.id}`} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                        Consultor PF
                      </span>
                    </td>
                    <td className="p-2 font-medium text-gray-900">{m.nome}</td>
                    <td className="p-2 text-right text-gray-600">
                      {m.meta ? formatarMoeda(Number(m.meta.valorMeta)) : "-"}
                    </td>
                    <td className="p-2 text-right text-gray-600">
                      {m.meta ? formatarMoeda(Number(m.meta.valorAtingido)) : "-"}
                    </td>
                    <td className="p-2 text-center text-gray-600">{m.totalParceiros}</td>
                  </tr>
                ))}

                {membros.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Nenhum membro na equipe
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
