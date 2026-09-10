"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Comissao {
  id: string;
  mesReferencia: string;
  comercial: {
    id: string;
    nome: string;
    email: string;
    funcao?: string;
  };
  valorVendas: number;
  valorComissao: number;
  status: string;
  dataPagamento?: string | null;
}

interface UseComissoesProps {
  filterStatus?: string;
  filterMes?: string;
  onSave?: (data: Omit<Comissao, "id">) => void;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (comissao: Comissao) => void;
}

export function useComissoes({
  filterStatus = "CALCULADA",
  filterMes,
  onSave,
  onDelete,
  onEdit,
}: UseComissoesProps = {}) {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComissoes, setSelectedComissoes] = useState<string[]>([]);
  const [filterStatusLocal, setFilterStatusLocal] = useState(filterStatus);
  const [filterMesLocal, setFilterMesLocal] = useState(filterMes ?? "");

  useEffect(() => {
    fetchComissoes();
  }, [filterStatusLocal, filterMesLocal]);

  async function fetchComissoes() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filterStatusLocal,
        ...(filterMesLocal && { mes: filterMesLocal }),
      });
      const res = await fetch(`/api/v1/backoffice/comissoes/lista?${params}`);
      if (!res.ok) {
        throw new Error("Erro ao carregar comissões");
      }
      const data = await res.json();
      setComissoes(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar comissões");
    } finally {
      setLoading(false);
    }
  }

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
        body: JSON.stringify({ comissaoIds: selectedComissoes }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao processar pagamento");
        return;
      }
      const data = await res.json();
      toast.success(`✅ ${data.mensagem} - Total: ${formatBRL(data.valorComissao || 0)}`);
      setSelectedComissoes([]);
      fetchComissoes();
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

  function exportarRecibo() {
    if (selectedComissoes.length === 0) {
      toast.error("Selecione comissões para exportar recibo");
      return;
    }

    const selecionadas = comissoes.filter((c) => selectedComissoes.includes(c.id!));
    const total = selecionadas.reduce((sum, c) => sum + c.valorComissao, 0);

    const conteudo = `
RECIBO DE PAGAMENTO DE COMISSÕES
===============================

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

===============================
Acesso Saúde - Gestão de Comissões
    `.trim();

    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8;" });
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

  return {
    comissoes,
    loading,
    selectedComissoes,
    setSelectedComissoes,
    filterStatus: filterStatusLocal,
    setFilterStatus: setFilterStatusLocal,
    filterMes: filterMesLocal,
    setFilterMes: setFilterMesLocal,
    totalSelecionado,
    totalGeral,
    handlePagar,
    toggleComissao,
    toggleTodas,
    exportarRecibo,
    fetchComissoes,
  };
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