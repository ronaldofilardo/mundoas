import { useEffect, useState } from "react";
import type { EquipeItem } from "../types";

export type { EquipeItem } from "../types";

type EquipeApiConsultor = {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string | null;
  status: string;
  setores?: Array<{ id: string; nome: string }>;
};

type EquipeApiComercial = {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  funcao?: string | null;
  percentualComissao?: number;
  status: string;
};

type EquipeApiMembro = {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  status: string;
  tipo?: string;
  tipoLideranca?: string | null;
  funcao?: string | null;
  percentualComissao?: number;
  liderancaId?: string | null;
  consultorPfs?: EquipeApiConsultor[];
  comerciais?: EquipeApiComercial[];
};

function mapMembro(m: EquipeApiMembro): EquipeItem {
  return {
    id: m.id,
    nome: m.nome,
    cpf: m.cpf,
    email: m.email,
    status: m.status,
    tipo: m.tipo,
    tipoLideranca: m.tipoLideranca ?? null,
    funcao: m.funcao ?? null,
    percentualComissao: m.percentualComissao ?? 0,
    liderancaId: m.liderancaId ?? null,
    kind: m.tipo === "LIDERANCA" ? "lideranca" : "comercial",
    consultorPfs: (m.consultorPfs ?? []).map((cp: EquipeApiConsultor) => ({
      id: cp.id,
      nome: cp.nome,
      cpf: cp.cpf,
      email: cp.email,
      telefone: cp.telefone ?? null,
      status: cp.status,
      setores: cp.setores ?? [],
    })),
    comerciais: (m.comerciais ?? []).map((c: EquipeApiComercial) => ({
      id: c.id,
      nome: c.nome,
      cpf: c.cpf,
      email: c.email,
      funcao: c.funcao ?? null,
      percentualComissao: c.percentualComissao ?? 0,
      status: c.status,
    })),
  };
}

export function useEquipe() {
  const [itens, setItens] = useState<EquipeItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchEquipe() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/backoffice/equipe");
      if (!res.ok) throw new Error("Falha ao carregar equipe");
      const data = await res.json();
      const liderancas: EquipeItem[] = (data.liderancas ?? []).map(mapMembro);
      const comerciais: EquipeItem[] = (data.comerciais ?? []).map(mapMembro);
      setItens([...liderancas, ...comerciais]);
    } catch (e) {
      console.error("[fetchEquipe] Exceção:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEquipe();
  }, []);

  return { itens, loading, refetch: fetchEquipe, setItens };
}
