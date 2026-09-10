import { formatBRL, formatCpf, formatDate, formatMonth } from "../utils";
import type { Procedimento } from "../types";

export function TabelaProcedimentos({ procedimentos }: { procedimentos: Procedimento[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-2">Data Ref.</th>
            <th className="text-left p-2">Paciente</th>
            <th className="text-left p-2">CPF</th>
            <th className="text-left p-2">Procedimento</th>
            <th className="text-right p-2">Valor Total</th>
            <th className="text-right p-2">Comissão</th>
            <th className="text-left p-2">Forma Pag.</th>
            <th className="text-left p-2">Unidade</th>
            <th className="text-left p-2">Comercial</th>
            <th className="text-left p-2">Consultor PF</th>
            <th className="text-left p-2">Parceiro</th>
            <th className="text-left p-2">Mês Ref.</th>
          </tr>
        </thead>
        <tbody>
          {procedimentos.length === 0 ? (
            <tr>
              <td colSpan={12} className="p-8 text-center text-gray-500">Nenhum procedimento encontrado</td>
            </tr>
          ) : (
            procedimentos.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-2 text-gray-600">{formatDate(p.dataReferencia)}</td>
                <td className="p-2 text-gray-900 font-medium">{p.paciente}</td>
                <td className="p-2 text-gray-600">{formatCpf(p.cpf)}</td>
                <td className="p-2 text-gray-600">{p.procedimento}</td>
                <td className="p-2 text-right text-green-600">
                  {formatBRL(Number(p.valorTotal || 0))}
                </td>
                <td className="p-2 text-right text-blue-600 font-medium">
                  {formatBRL(Number(p.valorComissao))}
                </td>
                <td className="p-2 text-gray-600">{p.formaPagamento}</td>
                <td className="p-2 text-gray-600">{p.unidade}</td>
                <td className="p-2 text-gray-600">{p.comercial?.nome || "-"}</td>
                <td className="p-2 text-gray-600">{p.consultorPf?.nome || "-"}</td>
                <td className="p-2">
                  {p.parceiro ? (
                    <span className="text-blue-600">{p.parceiro.nome}</span>
                  ) : (
                    <span className="text-orange-500 text-xs">Sem vínculo</span>
                  )}
                </td>
                <td className="p-2 text-gray-600">
                  {p.upload?.mesReferencia ? formatMonth(p.upload.mesReferencia) : "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}