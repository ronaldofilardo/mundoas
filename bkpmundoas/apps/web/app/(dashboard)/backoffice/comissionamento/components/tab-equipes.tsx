"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EquipeResumo {
  total: number;
  equipes: Array<{
    id: string;
    nome: string;
    tipo: string;
    email: string;
    status: string;
    totais: {
      comerciais: number;
      gestores: number;
      consultoresPf: number;
      parceiros: number;
    };
    comerciais: Array<{ id: string; nome: string; email: string; status: string; totalParceiros: number }>;
    gestores: Array<{ id: string; nome: string; email: string; status: string; totalParceiros: number }>;
    consultoresPf: Array<{ id: string; nome: string; email: string; status: string }>;
  }>;
}

export function TabEquipes() {
  const [dados, setDados] = useState<EquipeResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchEquipes();
  }, []);

  async function fetchEquipes() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/backoffice/equipes");
      if (!res.ok) throw new Error("Erro ao carregar equipes");
      const data = await res.json();
      setDados(data);
    } catch (error) {
      toast.error("Erro ao carregar equipes");
    } finally {
      setLoading(false);
    }
  }

  function formatarTipo(tipo: string) {
    const map: Record<string, string> = {
      COMERCIAL: "Comercial",
      GESTOR: "Gestor",
    };
    return map[tipo] || tipo;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!dados || dados.equipes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Nenhuma equipe cadastrada
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Total de {dados.total} lideranças cadastradas
        </p>
      </div>

      <div className="space-y-3">
        {dados.equipes.map((equipe) => (
          <div key={equipe.id} className="border rounded-lg overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
              onClick={() => setExpandedId(expandedId === equipe.id ? null : equipe.id)}
            >
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">{equipe.nome}</h3>
                  <p className="text-xs text-gray-500">{equipe.email}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    equipe.status === "ATIVO"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {equipe.status === "ATIVO" ? "Ativo" : "Inativo"}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {formatarTipo(equipe.tipo)}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{equipe.totais.comerciais}</p>
                  <p className="text-xs text-gray-500">Comerciais</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-purple-600">{equipe.totais.gestores}</p>
                  <p className="text-xs text-gray-500">Gestores</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-orange-600">{equipe.totais.consultoresPf}</p>
                  <p className="text-xs text-gray-500">Consultores PF</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{equipe.totais.parceiros}</p>
                  <p className="text-xs text-gray-500">Parceiros</p>
                </div>
                <span className="text-gray-400">{expandedId === equipe.id ? "▼" : "▶"}</span>
              </div>
            </div>

            {expandedId === equipe.id && (
              <div className="border-t bg-gray-50 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Comerciais</h4>
                    {equipe.comerciais.length === 0 ? (
                      <p className="text-xs text-gray-500">Nenhum comercial</p>
                    ) : (
                      <ul className="space-y-1">
                        {equipe.comerciais.map((c) => (
                          <li key={c.id} className="text-xs text-gray-600">
                            • {c.nome} ({c.email}) - {c.totalParceiros} parceiros
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Gestores</h4>
                    {equipe.gestores.length === 0 ? (
                      <p className="text-xs text-gray-500">Nenhum gestor</p>
                    ) : (
                      <ul className="space-y-1">
                        {equipe.gestores.map((g) => (
                          <li key={g.id} className="text-xs text-gray-600">
                            • {g.nome} ({g.email}) - {g.totalParceiros} parceiros
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Consultores PF</h4>
                    {equipe.consultoresPf.length === 0 ? (
                      <p className="text-xs text-gray-500">Nenhum consultor PF</p>
                    ) : (
                      <ul className="space-y-1">
                        {equipe.consultoresPf.map((cp) => (
                          <li key={cp.id} className="text-xs text-gray-600">
                            • {cp.nome} ({cp.email})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
