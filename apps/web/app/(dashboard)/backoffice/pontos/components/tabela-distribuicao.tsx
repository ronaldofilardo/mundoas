"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { CicloPontosItem, DistribuicaoPontosItem } from "../pontos-types";

interface TabelaDistribuicaoProps {
  data?: DistribuicaoPontosItem[];
  ciclo?: CicloPontosItem;
  onDistribuir?: () => void;
  onAtualizar?: () => void;
}

export function TabelaDistribuicao({ data, ciclo, onDistribuir, onAtualizar }: TabelaDistribuicaoProps) {
  const [filtroParceiro, setFiltroParceiro] = useState("");
  const [filtroIndicado, setFiltroIndicado] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [atualizando, setAtualizando] = useState(false);
  const [distribuindoTodos, setDistribuindoTodos] = useState(false);

  const parceiros = useMemo(() => {
    if (!data) return [];
    const unique = new Map(
      data
        .filter((p: DistribuicaoPontosItem) => p.parceiro?.nome)
        .map((p: DistribuicaoPontosItem) => [p.parceiro!.nome!, p.parceiro!])
    );
    return Array.from(unique.values());
  }, [data]);

  const producoesFiltradas = useMemo(() => {
    if (!data) return [];

    return data.filter((producao: DistribuicaoPontosItem) => {
      const parceiroMatch = !filtroParceiro || producao.parceiro?.nome === filtroParceiro;
      const indicadoMatch = !filtroIndicado || 
        producao.paciente?.toLowerCase().includes(filtroIndicado.toLowerCase());
      
      const dataTexto = producao.dataReferencia || producao.dataProcedimento;
      if (!dataTexto) return false;
      const dataProc = new Date(dataTexto);
      const dataInicioMatch = !filtroDataInicio || dataProc >= new Date(filtroDataInicio);
      const dataFimMatch = !filtroDataFim || dataProc <= new Date(filtroDataFim + "T23:59:59");

      return parceiroMatch && indicadoMatch && dataInicioMatch && dataFimMatch;
    });
  }, [data, filtroParceiro, filtroIndicado, filtroDataInicio, filtroDataFim]);

  const handleDistribuir = async (producaoId: string) => {
    try {
      const res = await fetch("/api/v1/backoffice/pontos/distribuir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producaoId }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao distribuir pontos");
        return;
      }

      toast.success(
        `${json.pontos} pontos distribuídos para ${json.parceiro.nome}!`,
      );

      onDistribuir?.();
    } catch {
      toast.error("Erro ao distribuir pontos");
    }
  };

  const limparFiltros = () => {
    setFiltroParceiro("");
    setFiltroIndicado("");
    setFiltroDataInicio("");
    setFiltroDataFim("");
  };

  const pendentes = useMemo(
    () => (data || []).filter((p) => !p.pontosDistribuidos).length,
    [data],
  );

  const handleDistribuirTodos = async () => {
    if (!pendentes) return;
    if (!window.confirm(`Distribuir pontos de ${pendentes} produção(ões) pendente(s)?`)) return;

    setDistribuindoTodos(true);
    try {
      const res = await fetch("/api/v1/backoffice/pontos/distribuir-todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao distribuir pontos em lote");
        return;
      }

      if (json.erros?.length) {
        toast.warning(
          `${json.distribuidos} produção(ões) creditada(s), ${json.totalPontos} pontos no total. ${json.erros.length} com erro.`,
        );
      } else {
        toast.success(json.mensagem || "Pontos distribuídos com sucesso!");
      }

      onDistribuir?.();
    } catch {
      toast.error("Erro ao distribuir pontos em lote");
    } finally {
      setDistribuindoTodos(false);
    }
  };

  const handleAtualizar = async () => {
    setAtualizando(true);
    try {
      await onAtualizar?.();
      toast.success("Configuração de pontos atualizada com sucesso!");
    } catch {
      toast.error("Erro ao atualizar configuração de pontos");
    } finally {
      setAtualizando(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Distribuir Pontos por Produção
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDistribuirTodos}
            disabled={distribuindoTodos || pendentes === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {distribuindoTodos ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Distribuindo...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Distribuir Todos
              </>
            )}
          </button>
          <button
            onClick={handleAtualizar}
            disabled={atualizando}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {atualizando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Atualizando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Atualizar
              </>
            )}
          </button>
        </div>
      </div>

      {ciclo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Ciclo vigente:</strong> {ciclo.nome}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Fonte: produções válidas da lista de produção por upload deste Backoffice.
            Os pontos são calculados por <strong>valor da produção ÷ R$ por ponto</strong>,
            conforme a configuração vigente na data de referência.
          </p>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="filtro-indicado" className="block text-xs font-medium text-gray-700 mb-1">
              Indicado
            </label>
            <input
              id="filtro-indicado"
              type="text"
              value={filtroIndicado}
              onChange={(e) => setFiltroIndicado(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="filtro-parceiro" className="block text-xs font-medium text-gray-700 mb-1">
              Parceiro
            </label>
            <select
              id="filtro-parceiro"
              value={filtroParceiro}
              onChange={(e) => setFiltroParceiro(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">Todos</option>
              {parceiros.map((parceiro) => (
                <option key={parceiro.nome ?? ""} value={parceiro.nome ?? ""}>
                  {parceiro.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtro-data-inicio" className="block text-xs font-medium text-gray-700 mb-1">
              Data Início
            </label>
            <input
              id="filtro-data-inicio"
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="filtro-data-fim" className="block text-xs font-medium text-gray-700 mb-1">
              Data Fim
            </label>
            <input
              id="filtro-data-fim"
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-gray-500">
            {producoesFiltradas.length} de {data?.length || 0} produções
          </p>
          {(filtroParceiro || filtroIndicado || filtroDataInicio || filtroDataFim) && (
            <button
              onClick={limparFiltros}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {!producoesFiltradas || producoesFiltradas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhuma produção encontrada
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Indicado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Procedimento
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Parceiro
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  R$/ponto
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  pts
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {producoesFiltradas.map((producao: DistribuicaoPontosItem) => (
                <tr key={producao.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {producao.paciente}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {producao.procedimento}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {producao.parceiro?.nome}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">
                    R$ {Number(producao.valorTotal ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-700 text-right">
                    R$ {Number(producao.valorPorPonto ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                    {new Date(producao.dataReferencia || producao.dataProcedimento || "").toLocaleDateString(
                      "pt-BR",
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {producao.pontosDistribuidos ? (
                      <span className="text-sm font-bold text-green-600">
                        {producao.pontosDistribuidos.pontos} pts
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-yellow-600">
                        {producao.pontosPotenciais || 0} pts
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {producao.pontosDistribuidos ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                        Distribuído
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDistribuir(producao.id)}
                        className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700 transition"
                      >
                        Distribuir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
