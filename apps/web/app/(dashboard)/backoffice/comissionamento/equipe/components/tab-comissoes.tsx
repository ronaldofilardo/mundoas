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
    refetch, 
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
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto min-w-[1600px]">
                <thead>
                  <tr className="border-b bg-gray-50 sticky top-0 z-10">
                    <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[280px]">
                      Empresa/Setor
                    </th>
                    <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[90px]">
                      Tipo
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-700 bg-gray-50 w-[120px]">
                      Meta
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-700 bg-gray-50 w-[120px]">
                      Produção
                    </th>
                    <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[90px]">
                      Meta Batida
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-700 bg-gray-50 w-[140px]">
                      Comissão Líder
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-700 bg-gray-50 w-[140px]">
                      Projeção Comissão
                    </th>
                    <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[80px]">
                      Falta
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[300px]">
                      Subordinados / Consultores
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {validacao.map((item: ValidacaoItem) => {
                    const membroComComissao = membrosComComissoes.find(m => m.id === item.liderancaId || (item.tipo === "COMERCIAL" && m.nome === item.empresaSetor));
                    const comissaoMes = membroComComissao?.comissoes.find(c => c.mesReferencia === mesAtual);
                    const temFalta = comissaoMes?.temFalta ?? false;

                    return (
                      <tbody key={item.empresaSetor}>
                        <tr className="border-b hover:bg-gray-50 font-medium">
                          <td className="p-3 text-gray-900">{item.empresaSetor}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              item.tipo === "LIDERANCA" 
                                ? "bg-purple-100 text-purple-800" 
                                : "bg-blue-100 text-blue-800"
                            }`}>
                              {item.tipo === "LIDERANCA" ? "Liderança" : "Comercial"}
                            </span>
                          </td>
                          <td className="p-3 text-right text-gray-700">{formatBRL(item.meta)}</td>
                          <td className="p-3 text-right text-gray-700">{formatBRL(item.producao)}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              item.metaBatida ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {item.metaBatida ? "✓ Sim" : "✗ Não"}
                            </span>
                          </td>
                          <td className="p-3 text-right font-medium text-purple-700">
                            {item.comissaoLideranca > 0 ? formatBRL(item.comissaoLideranca) : "-"}
                          </td>
                          <td className="p-3 text-right font-medium text-gray-900">
                            {formatBRL(item.comissaoCalculada)}
                          </td>
                          <td className="p-3 text-center">
                            <label className="flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
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
                            </label>
                          </td>
                          <td className="p-3 text-gray-500">
                            {item.subordinados.length > 0 && (
                              <span className="text-xs font-medium">Comerciais: {item.subordinados.length}</span>
                            )}
                            {item.consultoresPf.length > 0 && (
                              <span className="text-xs font-medium ml-2">Consultores PF: {item.consultoresPf.length}</span>
                            )}
                            {item.subordinados.length === 0 && item.consultoresPf.length === 0 && (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                        {item.subordinados.length > 0 && (
                          <tr className="bg-gray-50">
                            <td colSpan={9} className="p-0">
                              <div className="pl-10 pr-3 py-3 border-t border-gray-200">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left p-2 font-medium text-gray-500 w-[200px]">Nome</th>
                                      <th className="text-left p-2 font-medium text-gray-500 w-[150px]">Função</th>
                                      <th className="text-right p-2 font-medium text-gray-500 w-[100px]">Meta</th>
                                      <th className="text-right p-2 font-medium text-gray-500 w-[100px]">Produção</th>
                                      <th className="text-center p-2 font-medium text-gray-500 w-[80px]">Meta Batida</th>
                                      <th className="text-right p-2 font-medium text-gray-500 w-[100px]">% Comissão</th>
                                      <th className="text-right p-2 font-medium text-gray-500 w-[120px]">Comissão</th>
                                      <th className="text-center p-2 font-medium text-gray-500 w-[60px]">Falta</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.subordinados.map((s) => {
                                      const subComissao = membrosComComissoes.find(m => m.id === s.id)?.comissoes.find(c => c.mesReferencia === mesAtual);
                                      const subTemFalta = subComissao?.temFalta ?? false;

                                      return (
                                        <tr key={s.id} className="border-b border-gray-100 last:border-b-0 hover:bg-white">
                                          <td className="p-2 font-medium text-gray-800">{s.nome}</td>
                                          <td className="p-2 text-gray-600">{s.funcao.replace(/_/g, " ")}</td>
                                          <td className="p-2 text-right text-gray-700">{formatBRL(s.meta)}</td>
                                          <td className="p-2 text-right text-gray-700">{formatBRL(s.producao)}</td>
                                          <td className="p-2 text-center">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                              s.metaBatida ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                            }`}>
                                              {s.metaBatida ? "✓" : "✗"}
                                            </span>
                                          </td>
                                          <td className="p-2 text-right text-gray-600">{s.percentualComissao.toFixed(2)}%</td>
                                          <td className="p-2 text-right font-medium text-gray-900">{formatBRL(s.comissao)}</td>
                                          <td className="p-2 text-center">
                                            <label className="flex items-center justify-center cursor-pointer">
                                              <input
                                                type="checkbox"
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
                            </td>
                          </tr>
                        )}
                        {item.consultoresPf.length > 0 && (
                          <tr className="bg-gray-50">
                            <td colSpan={9} className="p-0">
                              <div className="pl-10 pr-3 py-3 border-t border-gray-200">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left p-2 font-medium text-gray-500 w-[200px]">Nome</th>
                                      <th className="text-right p-2 font-medium text-gray-500 w-[100px]">Meta</th>
                                      <th className="text-right p-2 font-medium text-gray-500 w-[100px]">Produção</th>
                                      <th className="text-center p-2 font-medium text-gray-500 w-[80px]">Meta Batida</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.consultoresPf.map((cp) => (
                                      <tr key={cp.id} className="border-b border-gray-100 last:border-b-0 hover:bg-white">
                                        <td className="p-2 font-medium text-gray-800">{cp.nome}</td>
                                        <td className="p-2 text-right text-gray-700">{formatBRL(cp.meta)}</td>
                                        <td className="p-2 text-right text-gray-700">{formatBRL(cp.producao)}</td>
                                        <td className="p-2 text-center">
                                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
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
                            </td>
                          </tr>
                        )}
                      </tbody>
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
                            <label className="flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
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