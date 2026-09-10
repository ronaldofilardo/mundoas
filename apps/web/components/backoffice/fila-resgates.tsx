"use client";

import { useFilaResgates } from "@/hooks/use-fila-resgates";
import { ResgateList } from "@/components/backoffice/fila-resgates/ResgateList";

export function FilaResgates() {
  const {
    resgates,
    loading,
    error,
    processando,
    setProcessando,
    statusFiltro,
    setStatusFiltro,
    observacao,
    setObservacao,
    resgateParaObservacao,
    setResgateParaObservacao,
    refetch,
  } = useFilaResgates("SOLICITADO");

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
    } catch {
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
      onFiltroChange={setStatusFiltro}
      onStatusChange={handleChangeStatus}
      processando={processando}
      observacao={observacao}
      setObservacao={setObservacao}
      resgateParaObservacao={resgateParaObservacao}
      setResgateParaObservacao={setResgateParaObservacao}
    />
  );
}
