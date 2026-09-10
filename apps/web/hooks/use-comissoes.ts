"use client";

import { useCallback, useEffect, useState } from "react";

export interface Comissao {
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
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return `${meses[parseInt(mesNum, 10) - 1]}/${ano}`;
}

export { formatBRL, formatMonth };

export function useComissoes(
  filterStatus: string = "CALCULADA",
  filterMes: string = "",
) {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComissoes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filterStatus,
        ...(filterMes && { mes: filterMes }),
      });
      const res = await fetch(`/api/v1/backoffice/comissoes/lista?${params}`);
      if (!res.ok) {
        throw new Error("Erro ao carregar comissões");
      }
      const data = await res.json();
      setComissoes(data);
    } catch {
      // error handled by component
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterMes]);

  useEffect(() => {
    fetchComissoes();
  }, [fetchComissoes]);

  return { comissoes, loading, refetch: fetchComissoes };
}
