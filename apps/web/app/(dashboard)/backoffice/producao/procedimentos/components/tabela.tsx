"use client";

import { useProducao } from "@/app/(dashboard)/backoffice/producao/procedimentos/components/use-producao";

interface Procedimento {
  id: string;
  dataReferencia: string;
  dataPagamento: string;
  formaPagamento: string;
  paciente: string;
  procedimento: string;
  cpf: string;
  tipoProcedimento: string;
  unidade: string;
  valorComissao: string;
  valorTotal?: number;
  parceiro: { id: string; nome: string; cpf: string } | null;
  indicado: { id: string; nome: string; cpf: string } | null;
  comercial: { id: string; nome: string; funcao?: string } | null;
  consultorPf: { id: string; nome: string } | null;
  upload: {
    id: string;
    nomeArquivo: string;
    mesReferencia: string;
  };
}

export function Tabela() {
  const {
    data,
    loading,
    filteredProcedimentos,
    formatDate,
    formatCpf,
    formatFuncao,
    formatMesReferencia,
  } = useProducao();

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

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
            <th className="text-left p-2 font-medium text-gray-600">Parceiro</th>
            <th className="text-left p-2 font-medium text-gray-600">Usuário da Conta</th>
            <th className="text-left p-2 font-medium text-gray-600">Mês Ref.</th>
          </tr>
        </thead>
        <tbody>
          {filteredProcedimentos?.map((p) => (
            <tr key={p.id} className="border-b hover:bg-gray-50">
              <td className="p-2 text-gray-600">{formatDate(p.dataReferencia)}</td>
              <td className="p-2 text-gray-900 font-medium">{p.paciente}</td>
              <td className="p-2 text-gray-600">{formatCpf(p.cpf)}</td>
              <td className="p-2 text-gray-600">{p.procedimento}</td>
              <td className="p-2 text-gray-600">
                R$ {Number(p.valorTotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </td>
              <td className="p-2 text-gray-600">{p.unidade}</td>
              <td className="p-2">
                {p.parceiro ? (
                  <span className="text-blue-600">{p.parceiro.nome}</span>
                ) : (
                  <span className="text-orange-500 text-xs">Sem vínculo</span>
                )}
              </td>
              <td className="p-2">
                {p.comercial ? (
                  <div>
                    <p className="text-xs font-medium text-gray-900">{p.comercial.nome}</p>
                    {p.comercial.funcao && (
                      <p className="text-xs text-gray-500">
                        {formatFuncao(p.comercial.funcao)}
                      </p>
                    )}
                  </div>
                ) : p.consultorPf ? (
                  <div>
                    <p className="text-xs font-medium text-gray-900">{p.consultorPf.nome}</p>
                    <p className="text-xs text-gray-500">Consultor PF</p>
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </td>
              <td className="p-2 text-gray-600">
                {formatMesReferencia(p.dataReferencia)}
              </td>
            </tr>
          ))}

          {filteredProcedimentos?.length === 0 && (
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