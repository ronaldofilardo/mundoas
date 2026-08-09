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
}

export function TabMetas({ itens }: TabMetasProps) {
  const { metasPorMembro, loading, refetch } = useEquipeMetas(itens);
  const [anoReferencia] = useState(new Date().getFullYear());
  const [showInativos, setShowInativos] = useState(false);
  const [regrasComerciais, setRegrasComerciais] = useState<RegrasComerciais | null>(null);
  const [regrasGestores, setRegrasGestores] = useState<RegrasGestores | null>(null);
  const [regrasLoading, setRegrasLoading] = useState(true);

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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Metas Anual ({anoReferencia})
        </h2>
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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto min-w-[1700px]">
            <colgroup>
              <col style={{ width: "240px" }} />
              <col style={{ width: "120px" }} />
              {MESES.map((m) => (
                <col key={m.value} style={{ width: "110px" }} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b bg-gray-50 sticky top-0 z-10">
                <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[240px]">
                  Membro
                </th>
                <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[120px]" />
                {MESES.map((m) => (
                  <th
                    key={m.value}
                    className="text-center p-2 font-semibold text-gray-700 bg-gray-50 w-[110px]"
                  >
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            {itensVisiveis.map((m) => {
                const metas = metasPorMembro[m.id] ?? [];
                const funcao =
                  m.funcao && m.funcao.trim() !== ""
                    ? m.funcao.replace(/_/g, " ")
                    : "-";

                const renderInput = (
                  mLabel: { value: string; label: string },
                  valor: number | string,
                  onSave: (mes: string, valor: string) => void,
                ) => {
                  const mesRef = `${anoReferencia}-${mLabel.value}`;
                  return (
                    <td key={mLabel.value} className="p-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={valor || ""}
                          placeholder="0"
                          className="w-full px-2 py-1 border rounded text-xs text-center focus-ring"
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val) onSave(mesRef, val);
                          }}
                        />
                      </div>
                    </td>
                  );
                };

                const renderComissao = (
                  mLabel: { value: string; label: string },
                  valorAtingido: number | string,
                ) => {
                  const mesRef = `${anoReferencia}-${mLabel.value}`;
                  const pct = getComissaoFromFuncao(
                    { regrasComerciais, regrasGestores },
                    funcao === "-" ? undefined : funcao,
                  );
                  const valorComissao = pct ? calcularValorComissaoNum(String(valorAtingido || 0), pct) : "";
                  return (
                    <td key={mLabel.value} className="p-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">R$</span>
                        <input
                          type="text"
                          readOnly
                          value={valorComissao ? valorComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}
                          placeholder="0"
                          className="w-full px-2 py-1 border rounded text-xs text-center bg-gray-50 text-gray-600"
                        />
                      </div>
                    </td>
                  );
                };

                return (
                  <tbody key={`${m.kind}-${m.id}`}>
                    <tr
                      className={`border-b hover:bg-gray-50 ${m.status === "INATIVO" ? "opacity-50" : ""}`}
                    >
                      <td className="p-3">
                        <p className="font-medium text-gray-900 truncate">{m.nome}</p>
                        <p className="text-xs text-gray-500 truncate">{m.email}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-xs font-semibold text-gray-500">Metas</p>
                      </td>
                      {MESES.map((mLabel) => {
                        const mesRef = `${anoReferencia}-${mLabel.value}`;
                        const meta = metas.find(
                          (mt) => mt.mesReferencia === mesRef,
                        );
                        const valor = meta ? Number(meta.valorMeta) : "";
                        return renderInput(mLabel, valor, (mes, v) =>
                          handleSalvarMeta(m.id, mes, v),
                        );
                      })}
                    </tr>
                    <tr
                      className={`border-b hover:bg-gray-50 ${m.status === "INATIVO" ? "opacity-50" : ""}`}
                    >
                       <td className="p-3" colSpan={1}>
                        <p className="text-xs text-gray-800 font-medium truncate">
                          {funcao}
                        </p>
                        <p className="text-xs text-gray-500">{m.status}</p>
                      </td>
                       <td className="p-3">
                         <p className="text-xs font-semibold text-gray-500">Produção</p>
                       </td>
                       {MESES.map((mLabel) => {
                         const mesRef = `${anoReferencia}-${mLabel.value}`;
                         const meta = metas.find(
                           (mt) => mt.mesReferencia === mesRef,
                         );
                         const valor = meta ? Number(meta.valorAtingido) : "";
                         return renderInput(mLabel, valor, (mes, v) =>
                           handleSalvarProducao(m.id, mes, v, funcao),
                         );
                       })}
                    </tr>
                    <tr
                      className={`border-b hover:bg-gray-50 ${m.status === "INATIVO" ? "opacity-50" : ""}`}
                    >
                       <td className="p-3" colSpan={1} />
                       <td className="p-3">
                         <p className="text-xs font-semibold text-gray-500">Comissão</p>
                       </td>
                       {MESES.map((mLabel) => {
                         const mesRef = `${anoReferencia}-${mLabel.value}`;
                         const meta = metas.find(
                           (mt) => mt.mesReferencia === mesRef,
                         );
                         const valorAtingido = meta ? Number(meta.valorAtingido) : "";
                         return renderComissao(mLabel, valorAtingido);
                       })}
                    </tr>
                  </tbody>
                );
              })}
          </table>
        </div>
      </div>
    </div>
  );
}
