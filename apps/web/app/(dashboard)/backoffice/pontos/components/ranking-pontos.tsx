"use client";

import type { RankingPontosItem } from "../pontos-types";

export function RankingPontos({ data }: { data?: RankingPontosItem[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Ranking</h2>
      {!data || data.length === 0 ? (
        <p className="text-gray-500">Ranking indisponível</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">Parceiro</th>
              <th className="text-right p-2">Pontos</th>
              <th className="text-right p-2">Produção (R$)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((pos: RankingPontosItem, i: number) => (
              <tr key={pos.id || i} className="border-b">
                <td className="p-2">{pos.posicao ?? i + 1}</td>
                <td className="p-2">{pos.parceiro?.nome}</td>
                <td className="p-2 text-right font-semibold">{pos.pontosAcumulados}</td>
                <td className="p-2 text-right font-semibold">{Number(pos.totalProducao || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

