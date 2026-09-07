"use client";

import type { MembroComComissoes, ValidacaoItem } from "../hooks/use-equipe-comissoes";
import { MESES } from "../constants";
import { ValidacaoItemCard } from "./validacao-item-card";

interface ValidacaoResultadosViewProps {
  anoReferencia: string;
  mesSelecionado: string;
  mesAtual: string;
  validacao: ValidacaoItem[];
  validacaoLoading: boolean;
  membrosComComissoes: MembroComComissoes[];
  showInativos: boolean;
  onShowInativosChange: (value: boolean) => void;
  onMesChange: (mes: string) => void;
  onVoltar: () => void;
  onToggleFalta: (membroId: string, mesReferencia: string, temFalta: boolean) => void;
}

export function ValidacaoResultadosView({
  anoReferencia,
  mesSelecionado,
  mesAtual,
  validacao,
  validacaoLoading,
  membrosComComissoes,
  showInativos,
  onShowInativosChange,
  onMesChange,
  onVoltar,
  onToggleFalta,
}: ValidacaoResultadosViewProps) {
  const mesLabel = MESES.find((m) => m.value === mesSelecionado)?.label || mesSelecionado;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Validação de Resultados - {mesLabel}/{anoReferencia}
          </h2>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            Mês Selecionado
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="mes-validacao" className="text-sm text-gray-600">Mês:</label>
          <select
            id="mes-validacao"
            value={mesSelecionado}
            onChange={(e) => onMesChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          >
            {MESES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInativos}
              onChange={(e) => onShowInativosChange(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            Inativos
          </label>
          <button
            onClick={onVoltar}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Voltar para Grade de Faltas
          </button>
        </div>
      </div>

      {validacaoLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : validacao.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">Nenhum dado de validação encontrado para {mesLabel}/{anoReferencia}</p>
          <p className="text-sm text-gray-400 mt-2">Verifique se as metas foram cadastradas na aba "Metas".</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {validacao.map((item) => (
            <ValidacaoItemCard
              key={item.empresaSetor}
              item={item}
              membrosComComissoes={membrosComComissoes}
              mesAtual={mesAtual}
              onToggleFalta={onToggleFalta}
            />
          ))}
        </div>
      )}
    </div>
  );
}
