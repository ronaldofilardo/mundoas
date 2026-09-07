import { formatDate, formatCpf, formatMes } from "../utils";
import { normalizarNomeUnidade } from "@/lib/formatadores-producao";
import type { Procedimento } from "../types";

interface ProducaoTableProps {
  procedimentos: Procedimento[];
}

export function ProducaoTable({ procedimentos }: ProducaoTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-2 font-medium text-gray-600">Data</th>
            <th className="text-left p-2 font-medium text-gray-600">Paciente</th>
            <th className="text-left p-2 font-medium text-gray-600">CPF</th>
            <th className="text-left p-2 font-medium text-gray-600">Procedimento</th>
            <th className="text-left p-2 font-medium text-gray-600">Total Pago</th>
            <th className="text-left p-2 font-medium text-gray-600">Unidade</th>
            <th className="text-left p-2 font-medium text-gray-600">Usuário da Conta</th>
            <th className="text-left p-2 font-medium text-gray-600">Parceiro</th>
            <th className="text-left p-2 font-medium text-gray-600">Mês Ref.</th>
          </tr>
        </thead>
        <tbody>
          {procedimentos.map((p) => (
            <tr key={p.id} className="border-b hover:bg-gray-50">
              <td className="p-2 text-gray-600">{formatDate(p.dataReferencia)}</td>
              <td className="p-2 text-gray-900 font-medium">{p.paciente}</td>
              <td className="p-2 text-gray-600">{formatCpf(p.cpf)}</td>
              <td className="p-2 text-gray-600">{p.procedimento}</td>
              <td className="p-2 text-gray-600">
                R$ {Number(p.valorTotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </td>
              <td className="p-2 text-gray-600">{normalizarNomeUnidade(p.unidade)}</td>
              <td className="p-2 text-gray-600">
                {p.comercial?.nome || p.consultorPf?.nome || "-"}
              </td>
              <td className="p-2">
                {p.parceiro ? (
                  <span className="text-blue-600">{p.parceiro.nome}</span>
                ) : (
                  <span className="text-orange-500 text-xs">Sem vínculo</span>
                )}
              </td>
              <td className="p-2 text-gray-600">
                {p.upload?.mesReferencia ? formatMes(p.upload.mesReferencia) : "-"}
              </td>
            </tr>
          ))}

          {procedimentos.length === 0 && (
            <tr>
              <td colSpan={9} className="p-8 text-center text-gray-500">
                Nenhum procedimento encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}