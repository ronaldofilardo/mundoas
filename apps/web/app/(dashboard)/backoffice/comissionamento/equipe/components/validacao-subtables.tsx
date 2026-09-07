"use client";

import { formatBRL } from "../../../usuarios/comerciais/utils";
import type { MembroComComissoes, ValidacaoItem } from "../hooks/use-equipe-comissoes";
import { FaltaCheckbox } from "./falta-checkbox";

type Subordinado = ValidacaoItem["subordinados"][number];
type ConsultorPf = ValidacaoItem["consultoresPf"][number];

interface SubordinadosTableProps {
  subordinados: Subordinado[];
  membrosComComissoes: MembroComComissoes[];
  mesAtual: string;
  onToggleFalta: (membroId: string, mesReferencia: string, temFalta: boolean) => void;
}

export function SubordinadosTable({ subordinados, membrosComComissoes, mesAtual, onToggleFalta }: SubordinadosTableProps) {
  return (
    <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Comerciais ({subordinados.length})
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-2 font-medium text-gray-500">Nome</th>
              <th className="text-left p-2 font-medium text-gray-500">Função</th>
              <th className="text-right p-2 font-medium text-gray-500">Meta</th>
              <th className="text-right p-2 font-medium text-gray-500">Produção</th>
              <th className="text-center p-2 font-medium text-gray-500">Meta Batida</th>
              <th className="text-right p-2 font-medium text-gray-500">% Comissão</th>
              <th className="text-right p-2 font-medium text-gray-500">Comissão</th>
              <th className="text-center p-2 font-medium text-gray-500">Falta</th>
            </tr>
          </thead>
          <tbody>
            {subordinados.map((s) => {
              const subComissao = membrosComComissoes.find((m) => m.id === s.id)?.comissoes.find((c) => c.mesReferencia === mesAtual);
              const subTemFalta = subComissao?.temFalta ?? false;

              return (
                <tr key={s.id} className="border-b border-gray-100 last:border-b-0 hover:bg-white">
                  <td className="p-2 font-medium text-gray-800 whitespace-nowrap">{s.nome}</td>
                  <td className="p-2 text-gray-600 whitespace-nowrap">{s.funcao.replace(/_/g, " ")}</td>
                  <td className="p-2 text-right text-gray-700 whitespace-nowrap">{formatBRL(s.meta)}</td>
                  <td className="p-2 text-right text-gray-700 whitespace-nowrap">{formatBRL(s.producao)}</td>
                  <td className="p-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      s.metaBatida ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {s.metaBatida ? "✓" : "✗"}
                    </span>
                  </td>
                  <td className="p-2 text-right text-gray-600">{s.percentualComissao.toFixed(2)}%</td>
                  <td className="p-2 text-right font-medium text-gray-900 whitespace-nowrap">{formatBRL(s.comissao)}</td>
                  <td className="p-2 text-center">
                    <FaltaCheckbox
                      inputId={`falta-${s.id}`}
                      ariaLabel={`Falta de ${s.nome}`}
                      checked={subTemFalta}
                      onChange={(checked) => onToggleFalta(s.id, mesAtual, checked)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ConsultoresPfTable({ consultoresPf }: { consultoresPf: ConsultorPf[] }) {
  return (
    <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Consultores PF ({consultoresPf.length})
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-2 font-medium text-gray-500">Nome</th>
              <th className="text-right p-2 font-medium text-gray-500">Meta</th>
              <th className="text-right p-2 font-medium text-gray-500">Produção</th>
              <th className="text-center p-2 font-medium text-gray-500">Meta Batida</th>
            </tr>
          </thead>
          <tbody>
            {consultoresPf.map((cp) => (
              <tr key={cp.id} className="border-b border-gray-100 last:border-b-0 hover:bg-white">
                <td className="p-2 font-medium text-gray-800 whitespace-nowrap">{cp.nome}</td>
                <td className="p-2 text-right text-gray-700 whitespace-nowrap">{formatBRL(cp.meta)}</td>
                <td className="p-2 text-right text-gray-700 whitespace-nowrap">{formatBRL(cp.producao)}</td>
                <td className="p-2 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    cp.metaBatida ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {cp.metaBatida ? "✓" : "✗"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
