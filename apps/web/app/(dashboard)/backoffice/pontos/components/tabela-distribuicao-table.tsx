"use client";

import type { DistribuicaoPontosItem } from "./pontos-types";

export function TabelaDistribuicaoTable({
  producoesFiltradas,
}: {
  producoesFiltradas: DistribuicaoPontosItem[];
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Indicado
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Procedimento
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Parceiro
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Total
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
              R$/ponto
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Data
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
              pts
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {producoesFiltradas.map((producao: DistribuicaoPontosItem) => (
            <tr key={producao.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                {producao.paciente}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                {producao.procedimento}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {producao.parceiro?.nome}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">
                R$ {Number(producao.valorTotal ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-blue-700 text-right">
                R$ {Number(producao.valorPorPonto ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 text-center">
                {new Date(producao.dataReferencia || producao.dataProcedimento || "").toLocaleDateString(
                  "pt-BR",
                )}
              </td>
              <td className="px-4 py-3 text-center">
                {producao.pontosDistribuidos ? (
                  <span className="text-sm font-bold text-green-600">
                    {producao.pontosDistribuidos.pontos} pts
                  </span>
                ) : (
                  <span className="text-sm font-bold text-yellow-600">
                    {producao.pontosPotenciais || 0} pts
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                {producao.pontosDistribuidos ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                    Distribuído
                  </span>
                ) : (
                  <button
                    onClick={() => {}}
                    className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700 transition"
                  >
                    Distribuir
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}