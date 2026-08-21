"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

interface Parceiro {
  id: string;
  nome: string;
  cpf: string;
}

interface Consultor {
  id: string;
  nome: string;
  cpf: string;
}

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

interface ProducaoData {
  procedimentos: Procedimento[];
  consultores: Consultor[];
  mesesDisponiveis: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function LiderancaProducaoPage() {
  const [data, setData] = useState<ProducaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterMes, setFilterMes] = useState("");
  const [filterConsultor, setFilterConsultor] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProducao();
  }, [filterMes, filterConsultor, currentPage]);

  async function fetchProducao() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
      });
      if (filterMes) params.set("mesReferencia", filterMes);
      if (filterConsultor) params.set("consultorPfId", filterConsultor);

      const res = await fetch(`/api/v1/lideranca/consultores-pf/producao/procedimentos?${params}`);
      if (!res.ok) throw new Error("Erro ao carregar produção");
      const json = await res.json();
      setData(json);
    } catch (e) {
      toast.error("Erro ao carregar dados de produção");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatCpf(cpf: string) {
    if (!cpf || cpf.length < 11) return cpf || "-";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function formatFuncao(funcao?: string) {
    if (!funcao) return "";
    return funcao
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }


  function formatMes(mes: string) {
    if (!mes) return "-";
    const [ano, mesNum] = mes.split("-");
    const date = new Date(Number(ano), Number(mesNum) - 1);
    return date.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  }

  function getMesReferenciaData(dataReferencia: string) {
    const d = new Date(dataReferencia);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function formatMesReferencia(dataReferencia: string) {
    const mesRef = getMesReferenciaData(dataReferencia);
    return formatMes(mesRef);
  }

  const filteredProcedimentos = useMemo(() => {
    return (data?.procedimentos ?? []).filter((p) => {
      if (filterSearch) {
        const search = filterSearch.toLowerCase();
        return (
          p.paciente.toLowerCase().includes(search) ||
          p.procedimento.toLowerCase().includes(search) ||
          p.cpf.includes(search) ||
          p.unidade.toLowerCase().includes(search) ||
          p.formaPagamento.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [data?.procedimentos, filterSearch]);

  const totalComissao = filteredProcedimentos?.reduce(
    (sum, p) => sum + Number(p.valorComissao),
    0
  ) || 0;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="font-sans space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produção da Equipe</h1>
          <p className="text-sm text-gray-500">
            Lista de procedimentos dos consultores PF vinculados à sua liderança
          </p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-xs text-gray-500">Total Comissões</p>
            <p className="text-lg font-bold text-green-600">
              R$ {totalComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          

          <select
            value={filterMes}
            onChange={(e) => {
              setFilterMes(e.target.value);
              setCurrentPage(1);
            }}
            className="text-sm border rounded px-3 py-2"
          >
            <option value="">Todos os Meses</option>
            {data?.mesesDisponiveis?.map((mes) => (
              <option key={mes} value={mes}>
                {formatMes(mes)}
              </option>
            ))}
          </select>

          <select
            value={filterConsultor}
            onChange={(e) => {
              setFilterConsultor(e.target.value);
              setCurrentPage(1);
            }}
            className="text-sm border rounded px-3 py-2"
          >
            <option value="">Todos os Consultores</option>
            {data?.consultores?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Buscar paciente, procedimento, CPF, unidade..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="text-sm border rounded px-3 py-2 flex-1 min-w-[250px]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium text-gray-600">Data</th>
                <th className="text-left p-2 font-medium text-gray-600">Paciente</th>
                <th className="text-left p-2 font-medium text-gray-600">CPF</th>
                <th className="text-left p-2 font-medium text-gray-600">Procedimento</th>
                <th className="text-left p-2 font-medium text-gray-600">Tipo</th>
                <th className="text-left p-2 font-medium text-gray-600">Unidade</th>
                <th className="text-left p-2 font-medium text-gray-600">Forma Pgto</th>
                <th className="text-left p-2 font-medium text-gray-600">Parceiro</th>
                <th className="text-left p-2 font-medium text-gray-600">Comercial</th>
                <th className="text-left p-2 font-medium text-gray-600">Consultor PF</th>
                <th className="text-left p-2 font-medium text-gray-600">Mês Ref.</th>
                <th className="text-right p-2 font-medium text-gray-600">Comissão</th>
              </tr>
            </thead>
            <tbody>
              {filteredProcedimentos?.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-gray-600">{formatDate(p.dataReferencia)}</td>
                  <td className="p-2 text-gray-900 font-medium">{p.paciente}</td>
                  <td className="p-2 text-gray-600">{formatCpf(p.cpf)}</td>
                  <td className="p-2 text-gray-600">{p.procedimento}</td>
                  <td className="p-2 text-gray-600">{p.tipoProcedimento}</td>
                  <td className="p-2 text-gray-600">{p.unidade}</td>
                  <td className="p-2 text-gray-600">{p.formaPagamento || "-"}</td>
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
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-2 text-gray-600">
                    {p.consultorPf ? p.consultorPf.nome : "-"}
                  </td>
                  <td className="p-2 text-gray-600">
                    {formatMesReferencia(p.dataReferencia)}
                  </td>
                  <td className="p-2 text-right text-green-600 font-medium">
                    R$ {Number(p.valorComissao).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}

              {filteredProcedimentos?.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-gray-500">
                    Nenhum procedimento encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.pagination?.totalPages && data.pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-xs border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-xs text-gray-500 py-1">
              {currentPage} / {data.pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={currentPage === data.pagination.totalPages}
              className="px-3 py-1 text-xs border rounded disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}