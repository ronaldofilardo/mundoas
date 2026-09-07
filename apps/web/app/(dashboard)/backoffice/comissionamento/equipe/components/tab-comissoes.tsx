"use client";

import { useMemo, useState, useEffect } from "react";
import type { EquipeItem } from "../types";
import { useEquipeComissoes } from "../hooks/use-equipe-comissoes";
import { GradeFaltasView } from "./grade-faltas-view";
import { ValidacaoResultadosView } from "./validacao-resultados-view";

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

  const anoFromUrl = mesReferencia.split("-")[0];
  const mesAtual = `${anoFromUrl}-${mesSelecionado}`;

  function handleMesChangeLocal(value: string) {
    setMesSelecionado(value);
    onMesChange(`${anoFromUrl}-${value}`);
  }

  function handleValidarResultados() {
    setViewMode("validacao");
    fetchValidacao(mesAtual);
  }

  function handleVoltarGradeFaltas() {
    setViewMode("comissoes");
  }

  function handleMesChangeValidacao(value: string) {
    handleMesChangeLocal(value);
    fetchValidacao(`${anoFromUrl}-${value}`);
  }

  if (itens.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Nenhum membro da equipe cadastrado.
      </p>
    );
  }

  if (viewMode === "validacao") {
    return (
      <ValidacaoResultadosView
        anoReferencia={anoFromUrl}
        mesSelecionado={mesSelecionado}
        mesAtual={mesAtual}
        validacao={validacao}
        validacaoLoading={validacaoLoading}
        membrosComComissoes={membrosComComissoes}
        showInativos={showInativos}
        onShowInativosChange={setShowInativos}
        onMesChange={handleMesChangeValidacao}
        onVoltar={handleVoltarGradeFaltas}
        onToggleFalta={atualizarFalta}
      />
    );
  }

  return (
    <GradeFaltasView
      anoReferencia={anoReferencia}
      itensVisiveis={itensVisiveis}
      membrosComComissoes={membrosComComissoes}
      loading={loading}
      showInativos={showInativos}
      onShowInativosChange={setShowInativos}
      onValidarResultados={handleValidarResultados}
      onToggleFalta={atualizarFalta}
    />
  );
}
