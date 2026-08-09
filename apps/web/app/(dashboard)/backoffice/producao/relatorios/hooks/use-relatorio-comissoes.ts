import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Comissao {
  id: string;
  mesReferencia: string;
  comercial?: {
    id: string;
    nome: string;
    email: string;
    funcao?: string;
  };
  consultorPf?: {
    id: string;
    nome: string;
    cpf: string;
  };
  valorVendas?: number;
  valorProducao?: number;
  valorProducaoCalculado?: number;
  divergente?: boolean;
  valorComissao: number;
  status: string;
  dataPagamento?: string | null;
}

interface Resumo {
  porMes: Array<{
    mes: string;
    totalVendas?: number;
    totalProducao?: number;
    totalProducaoCalculada?: number;
    totalDivergencias?: number;
    totalComissao: number;
    quantidade: number;
  }>;
  porFuncao?: Array<{
    funcao: string | null;
    totalVendas: number;
    totalComissao: number;
    quantidade: number;
    comerciaisCount: number;
  }>;
  totalGeral: {
    totalVendas?: number;
    totalProducao?: number;
    totalProducaoCalculada?: number;
    totalDivergencias?: number;
    totalComissao: number;
    quantidade: number;
  };
}

export function useRelatorioComissoes() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [tipo, setTipo] = useState<"comercial" | "consultor-pf">("comercial");
  const [loading, setLoading] = useState(false);
  const [comerciais, setComerciais] = useState<Array<{ id: string; nome: string; funcao?: string }>>([]);
  const [consultores, setConsultores] = useState<Array<{ id: string; nome: string; cpf: string }>>([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);

  async function fetchComerciais() {
    try {
      const res = await fetch("/api/v1/backoffice/equipe");
      if (res.ok) {
        const data = await res.json();
        const todos = [
          ...(data.liderancas ?? []).map((l: { id: string; nome: string; funcao?: string }) => ({ id: l.id, nome: l.nome, funcao: l.funcao })),
          ...(data.comerciais ?? []).map((c: { id: string; nome: string; funcao?: string }) => ({ id: c.id, nome: c.nome, funcao: c.funcao })),
        ];
        setComerciais(todos);
      }
    } catch {
      toast.error("Erro ao carregar comerciais");
    }
  }

  async function fetchRelatorio(filters?: {
    inicio?: string;
    fim?: string;
    comercialId?: string;
    funcao?: string;
    tipo?: string;
  }) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.inicio) params.append("inicio", filters.inicio);
      if (filters?.fim) params.append("fim", filters.fim);
      if (filters?.comercialId) params.append("comercialId", filters.comercialId);
      if (filters?.funcao) params.append("funcao", filters.funcao);
      if (filters?.tipo) params.append("tipo", filters.tipo);

      const res = await fetch(`/api/v1/backoffice/relatorio-comissoes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setComissoes(data.comissoes || []);
        setResumo(data.resumo || null);
        setMesesDisponiveis(data.meses || []);
        if (data.consultores) setConsultores(data.consultores);
      } else {
        toast.error("Erro ao carregar relatório");
      }
    } catch {
      toast.error("Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComerciais();
  }, []);

  return {
    comissoes,
    resumo,
    tipo,
    setTipo,
    loading,
    comerciais,
    consultores,
    mesesDisponiveis,
    fetchRelatorio,
  };
}
