"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

export function useSalvarMeta(opts: {
  consultorId: string;
  setorId: string;
  ano: number;
  onSaved?: () => void;
}) {
  const { consultorId, setorId, ano, onSaved } = opts;
  const [salvando, setSalvando] = useState(false);

  const salvar = useCallback(
    async (valorMensal: number) => {
      setSalvando(true);
      try {
        const res = await fetch(
          `/api/v1/backoffice/metas-vendas/${consultorId}/${setorId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ano, valorMensal }),
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err?.error ?? "Erro ao salvar meta");
          return false;
        }
        toast.success("Meta salva");
        onSaved?.();
        return true;
      } catch {
        toast.error("Erro ao salvar meta");
        return false;
      } finally {
        setSalvando(false);
      }
    },
    [consultorId, setorId, ano, onSaved],
  );

  return { salvar, salvando };
}
