"use client";

import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import type { EquipeItem } from "../types";
import { useEquipeMetas } from "../hooks/use-equipe-metas";
import {
  getComissaoFromFuncao,
  calcularValorComissaoNum,
} from "@/lib/comissao-calculo";
import type { RegrasComerciais, RegrasGestores } from "../../../usuarios/comerciais/types";

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

interface TabMetasProps {
  itens: EquipeItem[];
  mesReferencia: string;
  onMesChange: (mes: string) => void;
}

export function TabMetas({ itens, mesReferencia, onMesChange }: TabMetasProps) {
  const { metasPorMembro, loading, refetch } = useEquipeMetas(itens);
  const [showInativos, setShowInativos] = useState(false);
  const [regrasComerciais, setRegrasComerciais] = useState<RegrasComerciais | null>(null);
  const [regrasGestores, setRegrasGestores] = useState<RegrasGestores | null>(null);
  const [regrasLoading, setRegrasLoading] = useState(true);

  const [mesSelecionado, setMesSelecionado] = useState(mesReferencia.split("-")[1]);

  useEffect(() => {
    const mesFromUrl = mesReferencia.split("-")[1];
    setMesSelecionado(mesFromUrl);
  }, [mesReferencia]);

  useEffect(() => {
    async function fetchRegras() {
      setRegrasLoading(true);
      try {
        const [comRes, gesRes] = await Promise.all([
          fetch("/api/v1/backoffice/regras-comerciais"),
          fetch("/api/v1/backoffice/regras-gestores"),
        ]);
        const comData: RegrasComerciais = comRes.ok ? await comRes.json() : {
          cartaoAcessoSaude: 0,
          cireAtivo: 0,
          cireReceptivo: 0,
          franchisingAcesso: 0,
          franchisingCartao: 0,
          unidade: 0,
        };
        const gesData: RegrasGestores = gesRes.ok ? await gesRes.json() : {
          gerenteCire: 0,
          supervisorAtivo: 0,
          supervisorReceptivo: 0,
          supervisorFranquia: 0,
          supervisorAtendimento: 0,
          gerenteAtendimento: 0,
          supervisorComercial: 0,
        };
        setRegrasComerciais(comData);
        setRegrasGestores(gesData);
      } catch {
        toast.error("Erro ao carregar regras para cálculo de comissão");
      } finally {
        setRegrasLoading(false);
      }
    }
    fetchRegras();
  }, []);

  const itensVisiveis = useMemo(
    () => itens.filter((i) => showInativos || i.status === "ATIVO"),
    [itens, showInativos],
  );

  const mesRefSelecionado = `${mesReferencia.split("-")[0]}-${mesSelecionado}`;

  function handleMesChangeLocal(value: string) {
    setMesSelecionado(value);
    onMesChange(`${mesReferencia.split("-")[0]}-${value}`);
  }

  async function handleSalvarMeta(
    membroId: string,
    mes: string,
    valor: string,
  ) {
    const num = parseFloat(valor);
    if (Number.isNaN(num) || num < 0) {
      toast.error("Valor inválido");
      return;
    }
    try {
      const res = await fetch(`/api/v1/backoffice/equipe/${membroId}/metas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesReferencia: mes, valorMeta: num }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as { error?: string }).error || "Erro ao salvar meta");
        return;
      }
      toast.success("Meta salva");
      await refetch();
    } catch {
      toast.error("Erro ao salvar meta");
    }
  }

  async function handleSalvarProducao(
    membroId: string,
    mes: string,
    valor: string,
    funcao?: string,
  ) {
    const num = parseFloat(valor);
    if (Number.isNaN(num) || num < 0) {
      toast.error("Valor inválido");
      return;
    }
    try {
      const res = await fetch(`/api/v1/backoffice/equipe/${membroId}/metas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesReferencia: mes, valorAtingido: num }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as { error?: string }).error || "Erro ao salvar produção");
        return;
      }
      toast.success("Produção salva");

      const pct = getComissaoFromFuncao(
        { regrasComerciais, regrasGestores },
        funcao,
      );
      if (!pct) return;

      const valorComissao = calcularValorComissaoNum(valor, pct);
      if (!valorComissao) return;

      const resCom = await fetch(`/api/v1/backoffice/equipe/${membroId}/metas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesReferencia: mes, valorComissao: valorComissao }),
      });
      if (!resCom.ok) {
        const err = await resCom.json().catch(() => ({}));
        toast.error((err as { error?: string }).error || "Erro ao salvar comissão calculada");
        return;
      }
      toast.success("Comissão calculada e salva");
      await refetch();
    } catch {
      toast.error("Erro ao salvar produção");
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Carregando metas...</p>;
  }

  if (itensVisiveis.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Nenhum membro da equipe cadastrado.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Metas - {MESES.find(m => m.value === mesSelecionado)?.label}/{mesReferencia.split("-")[0]}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="mes-select" className="text-sm text-gray-600">Mês:</label>
            <select
              id="mes-select"
              value={mesSelecionado}
              onChange={(e) => handleMesChangeLocal(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              {MESES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInativos}
              onChange={(e) => setShowInativos(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            Mostrar inativos
          </label>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto min-w-[800px]">
            <colgroup>
              <col style={{ width: "280px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "160px" }} />
            </colgroup>
            <thead>
              <tr className="border-b bg-gray-50 sticky top-0 z-10">
                <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[280px]">
                  Empresa/Setor
                </th>
                <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[160px]">
                  Meta
                </th>
                <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[160px]">
                  Produzido
                </th>
                <th className="text-center p-3 font-semibold text-gray-50 w-[160px]">
                  Projeção
                </th>
              </tr>
            </thead>
            <tbody>
              {itensVisiveis.map((m) => {
                const metas = metasPorMembro[m.id] ?? [];
                const meta = metas.find((mt) => mt.mesReferencia === mesRefSelecionado);
                const valorMeta = meta ? Number(meta.valorMeta) : 0;
                const valorAtingido = meta ? Number(meta.valorAtingido) : 0;
                const valorComissao = meta ? Number(meta.valorComissao ?? 0) : 0;

                const funcao =
                  m.funcao && m.funcao.trim() !== ""
                    ? m.funcao.replace(/_/g, " ")
                    : "-";

                const pct = getComissaoFromFuncao(
                  { regrasComerciais, regrasGestores },
                  funcao === "-" ? undefined : funcao,
                );
                const comissaoCalculada = pct && valorAtingido > 0
                  ? calcularValorComissaoNum(String(valorAtingido), pct)
                  : valorComissao;

                const nomeExibicao = m.kind === "comercial"
                  ? m.nome
                  : m.kind === "lideranca"
                    ? `${m.nome} (Liderança)`
                    : m.nome;

                return (
                  <tr
                    key={`${m.kind}-${m.id}-${mesSelecionado}`}
                    className={`border-b hover:bg-gray-50 ${m.status === "INATIVO" ? "opacity-50" : ""}`}
                  >
                    <td className="p-3">
                      <p className="font-medium text-gray-900 truncate">{nomeExibicao}</p>
                      <p className="text-xs text-gray-500 truncate">{m.email}</p>
                      <p className="text-xs text-gray-400">{funcao} • {m.status}</p>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs text-gray-500">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={valorMeta || ""}
                          key={`meta-${m.id}-${mesSelecionado}`}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val) handleSalvarMeta(m.id, mesRefSelecionado, val);
                          }}
                          placeholder="0"
                          className="w-[120px] px-2 py-1 border rounded text-xs text-center focus:ring"
                        />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs text-gray-500">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={valorAtingido || ""}
                          key={`producao-${m.id}-${mesSelecionado}`}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val) handleSalvarProducao(m.id, mesRefSelecionado, val, funcao === "-" ? undefined : funcao);
                          }}
                          placeholder="0"
                          className="w-[120px] px-2 py-1 border rounded text-xs text-center focus:ring"
                        />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs text-gray-500">R$</span>
                        <input
                          type="text"
                          readOnly
                          value={comissaoCalculada ? comissaoCalculada.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00"}
                          className="w-[120px] px-2 py-1 border rounded text-xs text-center bg-gray-50 text-gray-600"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}