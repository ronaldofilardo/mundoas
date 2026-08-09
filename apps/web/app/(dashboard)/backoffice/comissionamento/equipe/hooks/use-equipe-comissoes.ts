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
}

export function useEquipeComissoes(membroId: string | null) {
  const [comissoes, setComissoes] = useState<ComissaoEquipe[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComissoes = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/backoffice/equipe/${id}/comissoes`);
      if (res.ok) {
        const data = await res.json();
        setComissoes(data);
      }
    } catch {
      toast.error("Erro ao carregar comissões");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (membroId) {
      fetchComissoes(membroId);
    } else {
      setComissoes([]);
    }
  }, [membroId, fetchComissoes]);

  return { comissoes, loading, refetch: fetchComissoes };
}
