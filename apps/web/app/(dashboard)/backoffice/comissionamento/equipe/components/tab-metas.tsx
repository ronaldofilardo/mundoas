"use client";

import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import type { EquipeItem } from "../types";
import { useEquipeMetas } from "../hooks/use-equipe-metas";
import { useRegrasComerciais } from "../hooks/use-regras-comerciais";
import { getComissaoFromFuncao, calcularValorComissaoNum } from "@/lib/comissao-calculo";
import type { RegrasComerciais, RegrasGestores } from "../../../usuarios/comerciais/types";
import { MetasTabela } from "./metas-tabela";

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
  const [producaoRecemSalva, setProducaoRecemSalva] = useState<Record<string, number>>({});
  const keyRecemSalva = (membroId: string, mesRef: string) => `${membroId}__${mesRef}`;

  useEffect(() => {
    setProducaoRecemSalva({});
  }, [mesReferencia]);

  useEffect(() => {
    const mesFromUrl = mesReferencia.split("-")[1];
    setMesSelecionado(mesFromUrl);
  }, [mesReferencia]);

  const { regrasComerciais: regrasCr, regrasGestores: regeGe, regrasLoading: regrasLoadingVisivel } =
    useRegrasComerciais();

  useEffect(() => {
    setRegrasComerciais(regrasCr);
    setRegrasGestores(regeGe);
    setRegrasLoading(regrasLoadingVisivel);
  }, [regrasCr, regeGe, regrasLoadingVisivel]);

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
      // Atualiza a Projeção IMEDIATAMENTE, sem esperar o refetch
      setProducaoRecemSalva((prev) => ({
        ...prev,
        [keyRecemSalva(membroId, mes)]: num,
      }));

      const pct = getComissaoFromFuncao(
        { regrasComerciais: regrasComerciais, regrasGestores: regeGe },
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

      <MetasTabela
        itensVisiveis={itensVisiveis}
        metasPorMembro={metasPorMembro}
        mesRefSelecionado={mesRefSelecionado}
        mesSelecionado={mesSelecionado}
        regrasComerciais={regrasComerciais}
        regrasGestores={regrasGestores}
        producaoRecemSalva={producaoRecemSalva}
        onSalvarMeta={handleSalvarMeta}
        onSalvarProducao={handleSalvarProducao}
      />
    </div>
  );
}