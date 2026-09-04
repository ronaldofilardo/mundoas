import { Fragment } from "react";
import { formatCpf, formatDateTime } from "./parceiros-pontos.utils";
import type { Parceiro } from "./parceiros-pontos.types";

interface ParceirosTableProps {
  parceiros: Parceiro[];
  expandedIds: Set<string>;
  loading: boolean;
  onToggleExpand: (id: string) => void;
  onOpenCreate: () => void;
  onOpenEdit: (p: Parceiro) => void;
  onDesligar: (p: Parceiro) => void;
  onReativar: (p: Parceiro) => void;
}

export function ParceirosTable({
  parceiros,
  expandedIds,
  loading,
  onToggleExpand,
  onOpenCreate,
  onOpenEdit,
  onDesligar,
  onReativar,
}: ParceirosTableProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={`skeleton-${i}`} className="card animate-pulse">
            <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 w-32 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (parceiros.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-gray-300 text-5xl mb-4">👥</div>
        <p className="text-gray-500 mb-4">Nenhum parceiro cadastrado</p>
        <button
          onClick={onOpenCreate}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium"
        >
          Criar primeiro parceiro
        </button>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-3 font-semibold text-gray-600 w-8"></th>
            <th className="text-left p-3 font-semibold text-gray-600">Nome</th>
            <th className="text-left p-3 font-semibold text-gray-600">CPF</th>
            <th className="text-left p-3 font-semibold text-gray-600">Email</th>
            <th className="text-left p-3 font-semibold text-gray-600">
              Indicados
            </th>
            <th className="text-left p-3 font-semibold text-gray-600">Status</th>
            <th className="text-right p-3 font-semibold text-gray-600">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {parceiros.map((p) => (
            <Fragment key={p.id}>
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <button
                    onClick={() => onToggleExpand(p.id)}
                    className="text-gray-500 hover:text-gray-700 text-lg"
                  >
                    {expandedIds.has(p.id) ? "▼" : "▶"}
                  </button>
                </td>
                <td className="p-3 font-medium text-gray-900">{p.nome}</td>
                <td className="p-3 text-gray-600">{formatCpf(p.cpf)}</td>
                <td className="p-3 text-gray-600">{p.email}</td>
                <td className="p-3 text-gray-600">{p.totalIndicados}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      p.status === "ATIVO"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {p.status === "ATIVO" ? "Ativo" : "Desligado"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => onOpenEdit(p)}
                      className="text-primary-600 hover:text-primary-800 text-xs font-medium"
                    >
                      Editar
                    </button>
                    {p.status === "ATIVO" ? (
                      <button
                        onClick={() => onDesligar(p)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Desligar
                      </button>
                    ) : (
                      <button
                        onClick={() => onReativar(p)}
                        className="text-green-600 hover:text-green-800 text-xs font-medium"
                      >
                        Reativar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              {expandedIds.has(p.id) && p.indicacoes.length > 0 && (
                <tr key={`${p.id}-indicados`} className="bg-gray-50">
                  <td colSpan={8} className="p-0">
                    <div className="px-6 py-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Clientes Indicados por {p.nome}
                      </p>
                      <table className="w-full text-xs bg-white rounded border">
                        <thead>
                          <tr className="border-b bg-gray-100">
                            <th className="text-left p-2 font-medium text-gray-600">
                              Nome
                            </th>
                            <th className="text-left p-2 font-medium text-gray-600">
                              CPF
                            </th>
                            <th className="text-left p-2 font-medium text-gray-600">
                              Status
                            </th>
                            <th className="text-left p-2 font-medium text-gray-600">
                              Data/Hora
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.indicacoes.map((i) => (
                            <tr
                              key={i.id}
                              className="border-b last:border-b-0"
                            >
                              <td className="p-2 text-gray-900">
                                {i.nome}
                              </td>
                              <td className="p-2 text-gray-600">
                                {formatCpf(i.cpf)}
                              </td>
                              <td className="p-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    i.status === "ATIVO"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {i.status === "ATIVO"
                                    ? "Ativo"
                                    : "Desvinculado"}
                                </span>
                              </td>
                              <td className="p-2 text-gray-500">
                                {formatDateTime(i.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
              {expandedIds.has(p.id) && p.indicacoes.length === 0 && (
                <tr key={`${p.id}-empty`} className="bg-gray-50">
                  <td
                    colSpan={8}
                    className="p-3 text-center text-gray-500 text-sm"
                  >
                    Nenhum cliente indicado ainda
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
