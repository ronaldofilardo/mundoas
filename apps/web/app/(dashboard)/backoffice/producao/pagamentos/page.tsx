"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { Resumo } from "@/app/(dashboard)/backoffice/producao/pagamentos/components/resumo";
import { Filtros } from "@/app/(dashboard)/backoffice/producao/pagamentos/components/filtros";
import { Tabela } from "@/app/(dashboard)/backoffice/producao/pagamentos/components/tabela";
import { useComissoes } from "@/app/(dashboard)/backoffice/producao/pagamentos/components/use-comissoes";

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

export default function PagamentosPage() {
  const {
    comissoes,
    loading,
    selectedComissoes,
    setSelectedComissoes,
    filterStatus,
    setFilterStatus,
    filterMes,
    setFilterMes,
    totalSelecionado,
    totalGeral,
    handlePagar,
    toggleComissao,
    toggleTodas,
    exportarRecibo,
    fetchComissoes,
  } = useComissoes();

  useEffect(() => {
    fetchComissoes();
  }, [filterStatus, filterMes]);

  return (
    <div>
      <Resumo />

      <Filtros onExportarRecibo={exportarRecibo} />

      <Tabela />
    </div>
  );
}