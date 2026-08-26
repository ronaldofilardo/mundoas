"use client";

import { useMemo, useState, useEffect } from "react";
import { formatBRL } from "../../../usuarios/comerciais/utils";
import type { EquipeItem } from "../types";
import { useEquipeComissoes, ValidacaoItem } from "../hooks/use-equipe-comissoes";

const MESES = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Fev" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Abr" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Ago" },
  { value: "09", label: "Set" },
  { value: "10", label: "Out" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dez" },
];

interface TabComissoesProps {
  itens: EquipeItem[];
  mesReferencia: string;
  onMesChange: (mes: string) => void;
}

export function TabComissoes({ itens, mesReferencia, onMesChange }: TabComissoesProps) {
  const [anoReferencia] = useState(new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(mesReferencia.split("-")[1]);
  const [showInativos, setShowInativos] = useState(false);
  const [viewMode, setViewMode] = useState<"comissoes" | "validacao">("comissoes");

  const { 
    membrosComComissoes, 
    loading, 
    atualizarFalta,
    validacao,
    validacaoLoading,
    fetchValidacao,
  } = useEquipeComissoes(itens);

  const itensVisiveis = useMemo(
    () => itens.filter((i) => showInativos || i.status === "ATIVO"),
    [itens, showInativos],
  );

  useEffect(() => {
    const mesFromUrl = mesReferencia.split("-")[1];
    setMesSelecionado(mesFromUrl);
  }, [mesReferencia]);

  function handleMesChangeLocal(value: string) {
    setMesSelecionado(value);
    onMesChange(`${mesReferencia.split("-")[0]}-${value}`);
  }

  function handleValidarResultados() {
    const mesAtual = `${mesReferencia.split("-")[0]}-${mesSelecionado}`;
    setViewMode("validacao");
    fetchValidacao(mesAtual);
  }

  function handleVoltarGradeFaltas() {
    setViewMode("comissoes");
  }

  if (itens.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Nenhum membro da equipe cadastrado.
      </p>
    );
  }

  // ==================== VIEW: VALIDAÇÃO DE RESULTADOS (puxa dados da aba Metas) ====================
  if (viewMode === "validacao") {
    const mesLabel = MESES.find(m => m.value === mesSelecionado)?.label || mesSelecionado;
    const mesAtual = `${mesReferencia.split("-")[0]}-${mesSelecionado}`;

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Validação de Resultados - {mesLabel}/{mesReferencia.split("-")[0]}
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
              onChange={(e) => {
                handleMesChangeLocal(e.target.value);
                fetchValidacao(`${mesReferencia.split("-")[0]}-${e.target.value}`);
              }}
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
                onChange={(e) => setShowInativos(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              Inativos
            </label>
            <button
              onClick={handleVoltarGradeFaltas}
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
            <p className="text-gray-500">Nenhum dado de validação encontrado para {mesLabel}/{mesReferencia.split("-")[0]}</p>
            <p className="text-sm text-gray-400 mt-2">Verifique se as metas foram cadastradas na aba "Metas".</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {validacao.map((item: ValidacaoItem) => {
              const membroComComissao = membrosComComissoes.find(m => m.id === item.liderancaId || (item.tipo === "COMERCIAL" && m.nome === item.empresaSetor));
              const comissaoMes = membroComComissao?.comissoes.find(c => c.mesReferencia === mesAtual);
              const temFalta = comissaoMes?.temFalta ?? false;
              const itemInputId = `falta-${item.tipo.toLowerCase()}-${(item.liderancaId ?? item.empresaSetor).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
              const itemLabel = item.liderancaNome ?? item.empresaSetor;

              return (
                <div key={item.empresaSetor} className="card overflow-hidden">
                  {/* Cabeçalho da liderança/comercial */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
                    <div className="min-w-[180px]">
                      <p className="font-semibold text-gray-900 leading-tight">{item.empresaSetor}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                        item.tipo === "LIDERANCA"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {item.tipo === "LIDERANCA" ? "Liderança" : "Comercial"}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 flex-1 flex-wrap">
                      <div>
                        <p className="text-xs text-gray-500">Meta</p>
                        <p className="text-sm font-medium text-gray-800">{formatBRL(item.meta)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Produção</p>
                        <p className="text-sm font-medium text-gray-800">{formatBRL(item.producao)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Meta Batida</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          item.metaBatida ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {item.metaBatida ? "✓ Sim" : "✗ Não"}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Comissão Líder</p>
                        <p className="text-sm font-medium text-purple-700">
                          {item.comissaoLideranca > 0 ? formatBRL(item.comissaoLideranca) : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Projeção Comissão</p>
                        <p className="text-sm font-semibold text-gray-900">{formatBRL(item.comissaoCalculada)}</p>
                      </div>
                    </div>

                    <label htmlFor={itemInputId} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 select-none">
                      <input
                        id={itemInputId}
                        type="checkbox"
                        aria-label={`Falta de ${itemLabel}`}
                        checked={temFalta}
                        onChange={(e) => {
                          const targetId = item.liderancaId || membroComComissao?.id;
                          if (targetId) {
                            atualizarFalta(targetId, mesAtual, e.target.checked);
                          }
                        }}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 hover:bg-primary-50 transition-colors"
                        title={temFalta ? "Teve faltas (clique para remover)" : "Sem faltas (clique para adicionar)"}
                      />
                      Falta
                    </label>
                  </div>

                  {/* Subordinados */}
                  {item.subordinados.length > 0 && (
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Comerciais ({item.subordinados.length})
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
                            {item.subordinados.map((s) => {
                              const subComissao = membrosComComissoes.find(m => m.id === s.id)?.comissoes.find(c => c.mesReferencia === mesAtual);
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
                                    <label htmlFor={`falta-${s.id}`} className="flex items-center justify-center cursor-pointer">
                                      <input
                                        id={`falta-${s.id}`}
                                        type="checkbox"
                                        aria-label={`Falta de ${s.nome}`}
                                        checked={subTemFalta}
                                        onChange={(e) => atualizarFalta(s.id, mesAtual, e.target.checked)}
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 hover:bg-primary-50 transition-colors"
                                        title={subTemFalta ? "Teve faltas (clique para remover)" : "Sem faltas (clique para adicionar)"}
                                      />
                                    </label>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Consultores PF */}
                  {item.consultoresPf.length > 0 && (
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Consultores PF ({item.consultoresPf.length})
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
                            {item.consultoresPf.map((cp) => (
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ==================== VIEW: GRADE DE FALTAS (12 meses - visualização padrão) ====================
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Grade de Faltas - {anoReferencia}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInativos}
              onChange={(e) => setShowInativos(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            Mostrar inativos
          </label>
          <button
            onClick={handleValidarResultados}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Validar Resultados
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Carregando comissões...</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto min-w-[1200px]">
              <colgroup>
                <col style={{ width: "280px" }} />
                <col style={{ width: "120px" }} />
                {MESES.map((m) => (
                  <col key={m.value} style={{ width: "60px" }} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b bg-gray-50 sticky top-0 z-10">
                  <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[280px]">
                    Empresa/Setor
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[120px]">
                    Função
                  </th>
                  {MESES.map((m) => (
                    <th
                      key={m.value}
                      className="text-center p-2 font-semibold text-gray-700 bg-gray-50 w-[60px]"
                    >
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {membrosComComissoes.map((membro) => {
                  const itemOriginal = itensVisiveis.find((i) => i.id === membro.id);
                  if (!itemOriginal) return null;

                  const funcao =
                    membro.funcao && membro.funcao.trim() !== ""
                      ? membro.funcao.replace(/_/g, " ")
                      : "-";

                  const nomeExibicao =
                    membro.kind === "comercial"
                      ? membro.nome
                      : membro.kind === "lideranca"
                        ? `${membro.nome} (Liderança)`
                        : membro.nome;

                  return (
                    <tr
                      key={`${membro.kind}-${membro.id}`}
                      className={`border-b hover:bg-gray-50 ${itemOriginal.status === "INATIVO" ? "opacity-50" : ""}`}
                    >
                      <td className="p-3">
                        <p className="font-medium text-gray-900 truncate">{nomeExibicao}</p>
                        <p className="text-xs text-gray-500 truncate">{membro.id}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-xs text-gray-600 truncate">{funcao}</p>
                      </td>
                      {MESES.map((mLabel) => {
                        const mesRef = `${anoReferencia}-${mLabel.value}`;
                        const comissao = membro.comissoes.find((c) => c.mesReferencia === mesRef);
                        const temFalta = comissao?.temFalta ?? false;

                        return (
                          <td key={mLabel.value} className="p-2 text-center">
                              <label htmlFor={`falta-${membro.id}-${mLabel.value}`} className="flex items-center justify-center cursor-pointer">
                              <input
                                id={`falta-${membro.id}-${mLabel.value}`}
                                type="checkbox"
                                aria-label={`Falta de ${nomeExibicao} em ${mLabel.label}`}
                                checked={temFalta}
                                onChange={(e) => atualizarFalta(membro.id, mesRef, e.target.checked)}
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 hover:bg-primary-50 transition-colors"
                                title={temFalta ? "Teve faltas (clique para remover)" : "Sem faltas (clique para adicionar)"}
                              />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}