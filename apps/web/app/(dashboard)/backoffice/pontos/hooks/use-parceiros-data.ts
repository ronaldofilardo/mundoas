import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Parceiro } from "../components/parceiros-pontos.types";

export function useParceirosData() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParceiros = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/backoffice/parceiros");
      const data = await res.json();
      if (Array.isArray(data)) {
        setParceiros(data);
      }
    } catch {
      toast.error("Erro ao carregar parceiros");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParceiros();
  }, [fetchParceiros]);

  const handleReativar = useCallback(async (p: Parceiro) => {
    if (!confirm(`Reativar ${p.nome}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/v1/backoffice/parceiros/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao reativar");
        return;
      }

      toast.success("Parceiro reativado com sucesso");
      fetchParceiros();
    } catch {
      toast.error("Erro ao reativar parceiro");
    }
  }, [fetchParceiros]);

  const handleDesligar = useCallback(async (p: Parceiro) => {
    if (
      !confirm(
        `Desligar ${p.nome}? Os vínculos com clientes serão desfeitos.`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/backoffice/parceiros?id=${p.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao desligar");
        return;
      }

      toast.success("Parceiro desligado com sucesso");
      fetchParceiros();
    } catch {
      toast.error("Erro ao desligar parceiro");
    }
  }, [fetchParceiros]);

  return {
    parceiros,
    loading,
    fetchParceiros,
    handleReativar,
    handleDesligar,
  };
}
