"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useProducaoRelatorio } from "./hooks/use-producao-relatorio";
import { formatBRL, formatMonth } from "./utils";
import { FiltrosProducaoRelatorio } from "./components/filtros-producao-relatorio";

export default function RelatorioProducaoPage() {
  const {
    procedimentos,
    parceiros,
    mesesDisponiveis,
    consultoresPf,
    comerciais,
    resumo,
    loading,
    pagination,
    fetchProducao,
  } = useProducaoRelatorio();

  const [mesReferencia, setMesReferencia] = useState("");
  const [parceiroId, setParceiroId] = useState("");
  const [consultorPfId, setConsultorPfId] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProcedimentos = useMemo(() => {
    return (procedimentos ?? []).filter((p) => {
      if (search) {
        const s = search.toLowerCase();
        return (
          p.paciente.toLowerCase().includes(s) ||
          p.procedimento.toLowerCase().includes(s) ||
          p.cpf.includes(s) ||
          p.unidade.toLowerCase().includes(s) ||
          p.formaPagamento.toLowerCase().includes(s) ||
          (p.comercial?.nome || "").toLowerCase().includes(s) ||
          (p.consultorPf?.nome || "").toLowerCase().includes(s)
        );
      }
      if (consultorPfId && p.consultorPf?.id !== consultorPfId) {
        return false;
      }
      return true;
    });
  }, [procedimentos, search, consultorPfId]);

  async function handleBuscar() {
    await fetchProducao({
      mesReferencia: mesReferencia || undefined,
      parceiroId: parceiroId || undefined,
      consultorPfId: consultorPfId || undefined,
      page: currentPage,
    });
  }

  function handleExportarCSV() {
    const headers = [
      "Data Referência",
      "Paciente",
      "CPF",
      "Procedimento",
      "Valor Total",
      "Comissão",
      "Forma Pagamento",
      "Unidade",
      "Comercial",
      "Consultor PF",
      "Parceiro",
      "Mês Referência",
      "Arquivo Upload",
    ];
    const rows = filteredProcedimentos.map((p) => [
      new Date(p.dataReferencia).toLocaleDateString("pt-BR"),
      p.paciente,
      p.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
      p.procedimento,
      Number(p.valorTotal || 0).toFixed(2),
      Number(p.valorComissao).toFixed(2),
      p.formaPagamento,
      p.unidade,
      p.comercial?.nome || "-",
      p.consultorPf?.nome || "-",
      p.parceiro?.nome || "Sem vínculo",
      p.upload?.mesReferencia ? formatMonth(p.upload.mesReferencia) : "-",
      p.upload?.nomeArquivo || "-",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-producao-${mesReferencia || "todos"}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  }

  function formatCpf(cpf: string) {
    if (!cpf || cpf.length < 11) return cpf || "-";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📊 Relatório de Produção</h1>
        <p className="text-gray-500 text-sm mt-1">
          Dados baseados na Lista de Produção (procedimentos importados via upload)
        </p>
      </div>

      <FiltrosProducaoRelatorio
        mesReferencia={mesReferencia}
        parceiroId={parceiroId}
        consultorPfId={consultorPfId}
        search={search}
        mesesDisponiveis={mesesDisponiveis}
        parceiros={parceiros}
        consultoresPf={consultoresPf}
        onMesChange={setMesReferencia}
        onParceiroChange={setParceiroId}
        onConsultorPfChange={setConsultorPfId}
        onSearchChange={setSearch}
        onBuscar={handleBuscar}
        onExportarCSV={handleExportarCSV}
        loading={loading}
      />

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : resumo ? (
        <div className="space-y-6">
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
                  {resumo.porMes.map((m) => (
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
                  {resumo.porComercial.map((c) => (
                    <tr key={c.comercialId} className="border-b">
                      <td className="p-2 font-medium">{c.comercialNome}</td>
                      <td className="p-2 text-gray-600">{c.funcao?.replace(/_/g, " ") || "-"}</td>
                      <td className="p-2 text-right">{c.qtdProcedimentos}</td>
                      <td className="p-2 text-right text-green-600">{formatBRL(c.totalValorTotal)}</td>
                      <td className="p-2 text-right text-blue-600">{formatBRL(c.totalComissao)}</td>
                    </tr>
                  ))}
                  {resumo.porComercial.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum comercial encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

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
                  {resumo.porParceiro.map((p) => (
                    <tr key={p.parceiroId} className="border-b">
                      <td className="p-2 font-medium">{p.parceiroNome}</td>
                      <td className="p-2 text-right">{p.qtdProcedimentos}</td>
                      <td className="p-2 text-right text-green-600">{formatBRL(p.totalValorTotal)}</td>
                      <td className="p-2 text-right text-blue-600">{formatBRL(p.totalComissao)}</td>
                    </tr>
                  ))}
                  {resumo.porParceiro.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">Nenhum parceiro encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

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
                  {resumo.porConsultorPf.map((c) => (
                    <tr key={c.consultorPfId} className="border-b">
                      <td className="p-2 font-medium">{c.consultorPfNome}</td>
                      <td className="p-2 text-right">{c.qtdProcedimentos}</td>
                      <td className="p-2 text-right text-green-600">{formatBRL(c.totalValorTotal)}</td>
                      <td className="p-2 text-right text-blue-600">{formatBRL(c.totalComissao)}</td>
                    </tr>
                  ))}
                  {resumo.porConsultorPf.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">Nenhum consultor PF encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Procedimentos Detalhados</h2>
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
                  {filteredProcedimentos.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-gray-500">Nenhum procedimento encontrado</td>
                    </tr>
                  ) : (
                    filteredProcedimentos.map((p) => (
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

            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    handleBuscar();
                  }}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-xs border rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-xs text-gray-500 py-1">
                  {currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => {
                    setCurrentPage((p) => Math.min(pagination.totalPages, p + 1));
                    handleBuscar();
                  }}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1 text-xs border rounded disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          Selecione os filtros e clique em "Buscar" para carregar o relatório
        </div>
      )}
    </div>
  );
}