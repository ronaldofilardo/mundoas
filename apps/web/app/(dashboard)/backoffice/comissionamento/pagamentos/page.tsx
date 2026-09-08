"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ResumoComissoes } from "@/comissionamento/components/ResumoComissoes";
import { FiltrosEActions } from "@/comissionamento/components/FiltrosEActions";
import { TabelaComissoes } from "@/comissionamento/components/TabelaComissoes";
import { useComissoes } from "@/hooks/use-comissoes";
import type { Comissao } from "@/comissionamento/types";

export default function PagamentosPage() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComissoes, setSelectedComissoes] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("CALCULADA");
  const [filterMes, setFilterMes] = useState("");

  const { refetch } = useComissoes(filterStatus, filterMes);

  useEffect(() => {
    refetch();
  }, [filterStatus, filterMes]);

  async function handlePagar() {
    if (selectedComissoes.length === 0) {
      toast.error("Selecione pelo menos uma comissão");
      return;
    }

    if (!confirm(`Confirmar pagamento de ${selectedComissoes.length} comissões?`)) {
      return;
    }

    try {
      const res = await fetch("/api/v1/backoffice/comissoes/pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comissaoIds: selectedComissoes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao processar pagamento");
        return;
      }
      const data = await res.json();
      toast.success(`✅ ${data.mensagem} - Total: ${formatBRL(data.valorComissao || 0)}`);
      setSelectedComissoes([]);
      refetch();
    } catch {
      toast.error("Erro ao processar pagamento");
    }
  }

  function toggleComissao(id: string) {
    setSelectedComissoes((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function toggleTodas() {
    const calculadas = comissoes.filter((c) => c.status === "CALCULADA").map((c) => c.id!);
    setSelectedComissoes((prev) =>
      prev.length === calculadas.length ? [] : calculadas
    );
  }

  function formatBRL(v: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(v);
  }

  function formatMonth(mes: string) {
    const [ano, mesNum] = mes.split("-");
    const meses = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ];
    return `${meses[parseInt(mesNum) - 1]}/${ano}`;
  }

  function exportarRecibo() {
    if (selectedComissoes.length === 0) {
      toast.error("Selecione comissões para exportar recibo");
      return;
    }

    const selecionadas = comissoes.filter((c) => selectedComissoes.includes(c.id!));
    const total = selecionadas.reduce((sum, c) => sum + c.valorComissao, 0);

    const reciboConteudo = `RECIBO DE PAGAMENTO DE COMISSÕES
================================

Data: ${new Date().toLocaleDateString("pt-BR")}

Comissões Pagas:
----------------
${selecionadas.map((c) => 
  `- ${c.comercial.nome} (${c.comercial.email})
   Mês: ${formatMonth(c.mesReferencia)}
   Vendas: ${formatBRL(c.valorVendas)}
   Comissão: ${formatBRL(c.valorComissao)}
   Status: ${c.status}
   Pagamento: ${c.dataPagamento ? new Date(c.dataPagamento).toLocaleDateString("pt-BR") : "Em processamento"}
`).join("\n")}

TOTAL: ${formatBRL(total)}

================================
Acesso Saúde - Gestão de Comissões`.trim();

    const blob = new Blob([reciboConteudo], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `recibo-comissoes-${new Date().toISOString().split("T")[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Recibo exportado!");
  }

  const totalSelecionado = comissoes
    .filter((c) => selectedComissoes.includes(c.id!))
    .reduce((sum, c) => sum + c.valorComissao, 0);

  const totalGeral = comissoes
    .filter((c) => c.status === "CALCULADA")
    .reduce((sum, c) => sum + c.valorComissao, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">💰 Gestão de Pagamentos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gerencie o pagamento de comissões dos comerciais
        </p>
      </div>

      <ResumoComissoes
        comissoes={comissoes}
        totalGeral={totalGeral}
        totalSelecionado={totalSelecionado}
        selectedComissoes={selectedComissoes}
        onToggleComissao={toggleComissao}
        onToggleTodas={toggleTodas}
        onExportarRecibo={exportarRecibo}
        onPagar={handlePagar}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterMes={filterMes}
        setFilterMes={setFilterMes}
        loading={loading}
      />

      <FiltrosEActions
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterMes={filterMes}
        setFilterMes={setFilterMes}
        selectedComissoes={selectedComissoes}
        setSelectedComissoes={setSelectedComissoes}
        onExportarRecibo={exportarRecibo}
        onPagar={handlePagar}
      />

      <TabelaComissoes
        comissoes={comissoes}
        loading={loading}
        selectedComissoes={selectedComissoes}
        onToggleComissao={toggleComissao}
        onToggleTodas={toggleTodas}
        onPagar={handlePagar}
        onExportarRecibo={exportarRecibo}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterMes={filterMes}
        setFilterMes={setFilterMes}
      />
    </div>
  );
}