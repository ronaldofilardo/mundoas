"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Parceiro {
  id: string;
  nome: string;
  cpf: string;
}

interface ConsultorPf {
  id: string;
  nome: string;
}

interface Procedimento {
  id: string;
  dataReferencia: string;
  dataPagamento: string;
  formaPagamento: string;
  paciente: string;
  procedimento: string;
  cpf: string;
  tipoProcedimento: string;
  unidade: string;
  valorComissao: string;
  valorTotal?: number;
  parceiro: { id: string; nome: string; cpf: string } | null;
  indicado: { id: string; nome: string; cpf: string } | null;
  comercial: { id: string; nome: string; funcao?: string } | null;
  consultorPf: { id: string; nome: string } | null;
  upload: {
    id: string;
    nomeArquivo: string;
    mesReferencia: string;
  };
}

interface ProducaoData {
  procedimentos: Procedimento[];
  parceiros: Parceiro[];
  mesesDisponiveis: string[];
  consultoresPf: ConsultorPf[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseProducaoProps {
  filterMes?: string;
  filterParceiro?: string;
  filterConsultorPf?: string;
  filterSearch?: string;
}

export function useProducao({
  filterMes,
  filterParceiro,
  filterConsultorPf,
  filterSearch,
}: UseProducaoProps = {}) {
  const [data, setData] = useState<ProducaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProducao();
  }, [filterMes, filterParceiro, filterConsultorPf, currentPage]);

  async function fetchProducao() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
      });
      if (filterMes) params.set("mesReferencia", filterMes);
      if (filterParceiro) params.set("parceiroId", filterParceiro);
      if (filterConsultorPf) params.set("consultorPfId", filterConsultorPf);

      const res = await fetch(`/api/v1/backoffice/producao?${params}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      toast.error("Erro ao carregar dados de produção");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatCpf(cpf: string) {
    if (!cpf || cpf.length < 11) return cpf || "-";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function formatFuncao(funcao?: string) {
    if (!funcao) return "";
    return funcao
      .replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function formatMes(mes: string) {
    if (!mes) return "-";
    const [ano, mesNum] = mes.split("-");
    const date = new Date(Number(ano), Number(mesNum) - 1);
    return date.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  }

  function getMesReferenciaData(dataReferencia: string) {
    const d = new Date(dataReferencia);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function formatMesReferencia(dataReferencia: string) {
    const mesRef = getMesReferenciaData(dataReferencia);
    return formatMes(mesRef);
  }

  const filteredProcedimentos = (data?.procedimentos ?? []).filter((p) => {
    if (filterSearch) {
      const search = filterSearch.toLowerCase();
      return (
        p.paciente.toLowerCase().includes(search) ||
        p.procedimento.toLowerCase().includes(search) ||
        p.cpf.includes(search) ||
        p.unidade.toLowerCase().includes(search) ||
        p.formaPagamento.toLowerCase().includes(search)
      );
    }
    if (filterConsultorPf && p.consultorPf?.id !== filterConsultorPf) {
      return false;
    }
    return true;
  });

  const totalComissao = filteredProcedimentos?.reduce(
    (sum, p) => sum + Number(p.valorComissao),
    0
  ) || 0;

  return {
    data,
    loading,
    currentPage,
    setCurrentPage,
    filterMes,
    setFilterMes: (e: { target: { value: string } }) => setFilterMes(e.target.value),
    filterParceiro,
    setFilterParceiro: (e: { target: { value: string } }) => setFilterParceiro(e.target.value),
    filterConsultorPf,
    setFilterConsultorPf: (e: { target: { value: string } }) => setFilterConsultorPf(e.target.value),
    filterSearch,
    setFilterSearch: (e: { target: { value: string } }) => setFilterSearch(e.target.value),
    filteredProcedimentos,
    totalComissao,
    formatDate,
    formatCpf,
    formatFuncao,
    formatMes,
    formatMesReferencia,
    fetchProducao,
  };
}