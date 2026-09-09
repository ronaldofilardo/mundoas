"use client";

import { useEffect, useState } from "react";
import { useFilaResgates } from "@/hooks/use-fila-resgates";
import { ResgateList } from "@/components/backoffice/fila-resgates/ResgateList";
import type { Resgate } from "@/components/backoffice/fila-resgates/types";

export function FilaResgates() {
  const {
    resgates,
    loading,
    error,
    processando,
    statusFiltro,
    observacao,
    setObservacao,
    resgateParaObservacao,
    setResgateParaObservacao,
    refetch,
  } = useFilaResgates("SOLICITADO");

  useEffect(() => {
    refetch();
  }, [statusFiltro]);

  const handleChangeStatus = async (resgateId: string, novoStatus: string) => {
    setProcessando(resgateId);
    try {
      const response = await fetch(
        `/api/v1/backoffice/pontos/resgates/${resgateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            novoStatus,
            observacao: observacao || undefined,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        alert(`Erro: ${data.error}`);
        return;
      }

      alert(`Resgate atualizado para ${novoStatus}`);
      setObservacao("");
      setResgateParaObservacao(null);
      refetch();
    } catch (err) {
      alert("Erro ao atualizar resgate");
    } finally {
      setProcessando(null);
    }
  };

  return (
    <ResgateList
      resgates={resgates}
      loading={loading}
      error={error}
      statusFiltro={statusFiltro}
      onStatusChange={handleChangeStatus}
      processando={processando}
      observacao={observacao}
      setObservacao={setObservacao}
      setResgateParaObservacao={setResgateParaObservacao}
    />
  );
}