import { formatBRL, formatMonth } from "../utils";
import type { ResumoProducao } from "../types";

export function ResumoPorMes({ porMes }: { porMes: ResumoProducao["porMes"] }) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumo por Mês</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-2">Mês</th>
              <th className="text-right p-2">Qtd. Procedimentos</th>
              <th className="text-right p-2">Total Valor</th>
              <th className="text-right p-2">Total Comissões</th>
            </tr>
          </thead>
          <tbody>
            {porMes.map((m) => (
              <tr key={m.mes} className="border-b">
                <td className="p-2 font-medium">{formatMonth(m.mes)}</td>
                <td className="p-2 text-right">{m.qtdProcedimentos}</td>
                <td className="p-2 text-right text-green-600">{formatBRL(m.totalValorTotal)}</td>
                <td className="p-2 text-right text-blue-600">{formatBRL(m.totalComissao)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ResumoPorComercial({ porComercial }: { porComercial: ResumoProducao["porComercial"] }) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumo por Comercial</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-2">Comercial</th>
              <th className="text-left p-2">Função</th>
              <th className="text-right p-2">Qtd. Procedimentos</th>
              <th className="text-right p-2">Total Valor</th>
              <th className="text-right p-2">Total Comissões</th>
            </tr>
          </thead>
          <tbody>
            {porComercial.map((c) => (
              <tr key={c.comercialId} className="border-b">
                <td className="p-2 font-medium">{c.comercialNome}</td>
                <td className="p-2 text-gray-600">{c.funcao?.replace(/_/g, " ") || "-"}</td>
                <td className="p-2 text-right">{c.qtdProcedimentos}</td>
                <td className="p-2 text-right text-green-600">{formatBRL(c.totalValorTotal)}</td>
                <td className="p-2 text-right text-blue-600">{formatBRL(c.totalComissao)}</td>
              </tr>
            ))}
            {porComercial.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum comercial encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ResumoPorParceiro({ porParceiro }: { porParceiro: ResumoProducao["porParceiro"] }) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumo por Parceiro</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-2">Parceiro</th>
              <th className="text-right p-2">Qtd. Procedimentos</th>
              <th className="text-right p-2">Total Valor</th>
              <th className="text-right p-2">Total Comissões</th>
            </tr>
          </thead>
          <tbody>
            {porParceiro.map((p) => (
              <tr key={p.parceiroId} className="border-b">
                <td className="p-2 font-medium">{p.parceiroNome}</td>
                <td className="p-2 text-right">{p.qtdProcedimentos}</td>
                <td className="p-2 text-right text-green-600">{formatBRL(p.totalValorTotal)}</td>
                <td className="p-2 text-right text-blue-600">{formatBRL(p.totalComissao)}</td>
              </tr>
            ))}
            {porParceiro.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">Nenhum parceiro encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ResumoPorConsultorPf({ porConsultorPf }: { porConsultorPf: ResumoProducao["porConsultorPf"] }) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumo por Consultor PF</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-2">Consultor PF</th>
              <th className="text-right p-2">Qtd. Procedimentos</th>
              <th className="text-right p-2">Total Valor</th>
              <th className="text-right p-2">Total Comissões</th>
            </tr>
          </thead>
          <tbody>
            {porConsultorPf.map((c) => (
              <tr key={c.consultorPfId} className="border-b">
                <td className="p-2 font-medium">{c.consultorPfNome}</td>
                <td className="p-2 text-right">{c.qtdProcedimentos}</td>
                <td className="p-2 text-right text-green-600">{formatBRL(c.totalValorTotal)}</td>
                <td className="p-2 text-right text-blue-600">{formatBRL(c.totalComissao)}</td>
              </tr>
            ))}
            {porConsultorPf.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">Nenhum consultor PF encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}