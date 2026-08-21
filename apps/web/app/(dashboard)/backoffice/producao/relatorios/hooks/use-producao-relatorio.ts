"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

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

interface Parceiro {
  id: string;
  nome: string;
  cpf: string;
}

interface ConsultorPf {
  id: string;
  nome: string;
}

interface ProducaoResponse {
  procedimentos: Procedimento[];
  parceiros: Parceiro[];
  mesesDisponiveis: string[];
  consultoresPf: ConsultorPf[];
  comerciais: Array<{ id: string; nome: string; funcao?: string }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ResumoProducao {
  totalProcedimentos: number;
  totalComissao: number;
  totalValorTotal: number;
  porMes: Array<{
    mes: string;
    qtdProcedimentos: number;
    totalComissao: number;
    totalValorTotal: number;
  }>;
  porComercial: Array<{
    comercialId: string;
    comercialNome: string;
    funcao?: string;
    qtdProcedimentos: number;
    totalComissao: number;
    totalValorTotal: number;
  }>;
  porParceiro: Array<{
    parceiroId: string;
    parceiroNome: string;
    qtdProcedimentos: number;
    totalComissao: number;
    totalValorTotal: number;
  }>;
  porConsultorPf: Array<{
    consultorPfId: string;
    consultorPfNome: string;
    qtdProcedimentos: number;
    totalComissao: number;
    totalValorTotal: number;
  }>;
}

export function useProducaoRelatorio() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);
  const [consultoresPf, setConsultoresPf] = useState<ConsultorPf[]>([]);
  const [comerciais, setComerciais] = useState<Array<{ id: string; nome: string; funcao?: string }>>([]);
  const [resumo, setResumo] = useState<ResumoProducao | null>(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  const fetchProducao = useCallback(async (filters?: {
    mesReferencia?: string;
    parceiroId?: string;
    consultorPfId?: string;
    page?: number;
    limit?: number;
  }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (filters?.page || 1).toString(),
        limit: (filters?.limit || 50).toString(),
      });
      if (filters?.mesReferencia) params.set("mesReferencia", filters.mesReferencia);
      if (filters?.parceiroId) params.set("parceiroId", filters.parceiroId);
      if (filters?.consultorPfId) params.set("consultorPfId", filters.consultorPfId);

      const res = await fetch(`/api/v1/backoffice/producao?${params}`);
      if (res.ok) {
        const data: ProducaoResponse = await res.json();
        setProcedimentos(data.procedimentos);
        setParceiros(data.parceiros);
        setMesesDisponiveis(data.mesesDisponiveis);
        setConsultoresPf(data.consultoresPf);
        setComerciais(data.comerciais);
        setPagination(data.pagination);
        
        const resumoCalculado = calcularResumo(data.procedimentos);
        setResumo(resumoCalculado);
      } else {
        toast.error("Erro ao carregar dados de produção");
      }
    } catch {
      toast.error("Erro ao carregar dados de produção");
    } finally {
      setLoading(false);
    }
  }, []);

  const calcularResumo = (procs: Procedimento[]): ResumoProducao => {
    const porMesMap = new Map<string, { qtd: number; comissao: number; valorTotal: number }>();
    const porComercialMap = new Map<string, { nome: string; funcao?: string; qtd: number; comissao: number; valorTotal: number }>();
    const porParceiroMap = new Map<string, { nome: string; qtd: number; comissao: number; valorTotal: number }>();
    const porConsultorPfMap = new Map<string, { nome: string; qtd: number; comissao: number; valorTotal: number }>();

    let totalComissao = 0;
    let totalValorTotal = 0;

    procs.forEach((p) => {
      const mes = p.upload?.mesReferencia || new Date(p.dataReferencia).toISOString().slice(0, 7);
      const comissao = Number(p.valorComissao);
      const valorTotal = Number(p.valorTotal || 0);

      totalComissao += comissao;
      totalValorTotal += valorTotal;

      const mesAtual = porMesMap.get(mes) || { qtd: 0, comissao: 0, valorTotal: 0 };
      mesAtual.qtd += 1;
      mesAtual.comissao += comissao;
      mesAtual.valorTotal += valorTotal;
      porMesMap.set(mes, mesAtual);

      if (p.comercial) {
        const key = p.comercial.id;
        const atual = porComercialMap.get(key) || { nome: p.comercial.nome, funcao: p.comercial.funcao, qtd: 0, comissao: 0, valorTotal: 0 };
        atual.qtd += 1;
        atual.comissao += comissao;
        atual.valorTotal += valorTotal;
        porComercialMap.set(key, atual);
      }

      if (p.parceiro) {
        const key = p.parceiro.id;
        const atual = porParceiroMap.get(key) || { nome: p.parceiro.nome, qtd: 0, comissao: 0, valorTotal: 0 };
        atual.qtd += 1;
        atual.comissao += comissao;
        atual.valorTotal += valorTotal;
        porParceiroMap.set(key, atual);
      }

      if (p.consultorPf) {
        const key = p.consultorPf.id;
        const atual = porConsultorPfMap.get(key) || { nome: p.consultorPf.nome, qtd: 0, comissao: 0, valorTotal: 0 };
        atual.qtd += 1;
        atual.comissao += comissao;
        atual.valorTotal += valorTotal;
        porConsultorPfMap.set(key, atual);
      }
    });

    return {
      totalProcedimentos: procs.length,
      totalComissao,
      totalValorTotal,
      porMes: Array.from(porMesMap.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([mes, dados]) => ({ mes, qtdProcedimentos: dados.qtd, totalComissao: dados.comissao, totalValorTotal: dados.valorTotal })),
      porComercial: Array.from(porComercialMap.entries())
        .map(([comercialId, dados]) => ({
          comercialId,
          comercialNome: dados.nome,
          funcao: dados.funcao,
          qtdProcedimentos: dados.qtd,
          totalComissao: dados.comissao,
          totalValorTotal: dados.valorTotal,
        }))
        .sort((a, b) => b.totalComissao - a.totalComissao),
      porParceiro: Array.from(porParceiroMap.entries())
        .map(([parceiroId, dados]) => ({
          parceiroId,
          parceiroNome: dados.nome,
          qtdProcedimentos: dados.qtd,
          totalComissao: dados.comissao,
          totalValorTotal: dados.valorTotal,
        }))
        .sort((a, b) => b.totalComissao - a.totalComissao),
      porConsultorPf: Array.from(porConsultorPfMap.entries())
        .map(([consultorPfId, dados]) => ({
          consultorPfId,
          consultorPfNome: dados.nome,
          qtdProcedimentos: dados.qtd,
          totalComissao: dados.comissao,
          totalValorTotal: dados.valorTotal,
        }))
        .sort((a, b) => b.totalComissao - a.totalComissao),
    };
  };

  useEffect(() => {
    fetchProducao();
  }, [fetchProducao]);

  return {
    procedimentos,
    parceiros,
    mesesDisponiveis,
    consultoresPf,
    comerciais,
    resumo,
    loading,
    pagination,
    fetchProducao,
  };
}

