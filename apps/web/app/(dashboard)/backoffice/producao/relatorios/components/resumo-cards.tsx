import { formatBRL } from "../utils";
import type { ResumoProducao } from "../types";

export function ResumoCards({ resumo }: { resumo: ResumoProducao }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="card">
        <h3 className="text-sm text-gray-600">Total Procedimentos</h3>
        <p className="text-2xl font-bold text-gray-900">{resumo.totalProcedimentos}</p>
      </div>
      <div className="card">
        <h3 className="text-sm text-gray-600">Total Valor (R$)</h3>
        <p className="text-2xl font-bold text-green-600">{formatBRL(resumo.totalValorTotal)}</p>
      </div>
      <div className="card">
        <h3 className="text-sm text-gray-600">Total Comissões (R$)</h3>
        <p className="text-2xl font-bold text-blue-600">{formatBRL(resumo.totalComissao)}</p>
      </div>
      <div className="card">
        <h3 className="text-sm text-gray-600">Méd. Comissão/Proc.</h3>
        <p className="text-2xl font-bold text-purple-600">
          {resumo.totalProcedimentos > 0
            ? formatBRL(resumo.totalComissao / resumo.totalProcedimentos)
            : formatBRL(0)}
        </p>
      </div>
    </div>
  );
}