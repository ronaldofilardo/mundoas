import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function useRelatorioComissoes() {
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inicio, setInicio] = useState<string>("");
  const [fim, setFim] = useState<string>("");
  const [comercialId, setComercialId] = useState<string>("");
  const [comerciais, setComerciais] = useState<Array<{ id: string; nome: string }>>([]);

  useEffect(() => {
    fetch("/api/v1/backoffice/equipe")
      .then((res) => res.json())
      .then((data) => {
        const todos = [
          ...(data.liderancas ?? []).map((l: { id: string; nome: string }) => ({ id: l.id, nome: l.nome })),
          ...(data.comerciais ?? []).map((c: { id: string; nome: string }) => ({ id: c.id, nome: c.nome })),
        ];
        setComerciais(todos);
      })
      .catch(() => {});
  }, []);

  const buscarRelatorio = useCallback(async () => {
    if (!inicio || !fim) {
      toast.error("Selecione o período inicial e final");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        inicio,
        fim,
        ...(comercialId && { comercialId }),
      });
      const res = await fetch(`/api/v1/backoffice/relatorio-comissoes?${params}`);
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao buscar relatório");
        return;
      }
      const data = await res.json();
      setComissoes(data.comissoes);
      setResumo(data.resumo);
      toast.success("Relatório carregado com sucesso!");
    } catch {
      toast.error("Erro ao buscar relatório");
    } finally {
      setLoading(false);
    }
  }, [inicio, fim, comercialId, toast]);

  const exportarCSV = useCallback(() => {
    const headers = ["Mês", "Comercial", "Função", "Vendas", "Comissão", "Status", "Pagamento"];
    const rows = comissoes.map((c) => [
      c.mesReferencia,
      c.comercial.nome,
      c.comercial.funcao || "-",
      c.valorVendas.toFixed(2),
      c.valorComissao.toFixed(2),
      c.status,
      c.dataPagamento || "-",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-comissoes-${inicio}-a-${fim}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  }, [comissoes, inicio, fim, toast]);

  return {
    comissoes,
    resumo,
    loading,
    inicio,
    setInicio,
    fim,
    setFim,
    comercialId,
    setComercialId,
    comerciais,
    setComerciais,
    buscarRelatorio,
    exportarCSV,
  };
}
