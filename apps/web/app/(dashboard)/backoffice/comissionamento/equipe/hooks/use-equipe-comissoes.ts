"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface ComissaoEquipe {
  id?: string;
  equipeId?: string;
  mesReferencia: string;
  valorVendas: string | number;
  valorComissao: string | number;
  status: string;
  dataPagamento?: string | null;
  temFalta: boolean;
}

export interface MembroComComissoes {
  id: string;
  nome: string;
  kind: "comercial" | "lideranca";
  funcao?: string | null;
  comissoes: ComissaoEquipe[];
}

export interface ValidacaoItem {
  empresaSetor: string;
  tipo: "LIDERANCA" | "COMERCIAL";
  liderancaId?: string;
  liderancaNome?: string;
  meta: number;
  producao: number;
  comissaoCalculada: number;
  metaBatida: boolean;
  comissaoLideranca: number;
  subordinados: Array<{
    id: string;
    nome: string;
    funcao: string;
    percentualComissao: number;
    meta: number;
    producao: number;
    comissao: number;
    metaBatida: boolean;
  }>;
  consultoresPf: Array<{
    id: string;
    nome: string;
    meta: number;
    producao: number;
    metaBatida: boolean;
  }>;
}

export interface ValidacaoResponse {
  mesReferencia: string;
  validacao: ValidacaoItem[];
}

export function useEquipeComissoes(itens: { id: string; nome: string; kind: "comercial" | "lideranca"; funcao?: string | null }[]) {
  const [membrosComComissoes, setMembrosComComissoes] = useState<MembroComComissoes[]>([]);
  const [validacao, setValidacao] = useState<ValidacaoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [validacaoLoading, setValidacaoLoading] = useState(false);

  const fetchAllComissoes = useCallback(async () => {
    if (itens.length === 0) {
      setMembrosComComissoes([]);
      return;
    }
    setLoading(true);
    try {
      const resultados = await Promise.all(
        itens.map(async (m) => {
          const res = await fetch(`/api/v1/backoffice/equipe/${m.id}/comissoes`);
          const comissoes: ComissaoEquipe[] = res.ok ? await res.json() : [];
          return { id: m.id, nome: m.nome, kind: m.kind, funcao: m.funcao, comissoes };
        }),
      );
      setMembrosComComissoes(resultados);
    } catch {
      toast.error("Erro ao carregar comissões");
    } finally {
      setLoading(false);
    }
  }, [itens]);

  const fetchValidacao = useCallback(async (mesReferencia: string) => {
    setValidacaoLoading(true);
    try {
      const res = await fetch(`/api/v1/backoffice/comissionamento/validacao/${mesReferencia}`);
      if (res.ok) {
        const data: ValidacaoResponse = await res.json();
        setValidacao(data.validacao);
      } else {
        toast.error("Erro ao carregar validação");
      }
    } catch {
      toast.error("Erro ao carregar validação");
    } finally {
      setValidacaoLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllComissoes();
  }, [fetchAllComissoes]);

  async function atualizarFalta(membroId: string, mesReferencia: string, temFalta: boolean): Promise<boolean> {
    try {
      const res = await fetch(`/api/v1/backoffice/equipe/${membroId}/comissoes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesReferencia, temFalta }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as { error?: string }).error || "Erro ao atualizar falta");
        return false;
      }
      await fetchAllComissoes();
      return true;
    } catch {
      toast.error("Erro ao atualizar falta");
      return false;
    }
  }

  return { 
    membrosComComissoes, 
    loading, 
    refetch: fetchAllComissoes, 
    atualizarFalta,
    validacao,
    validacaoLoading,
    fetchValidacao,
  };
}