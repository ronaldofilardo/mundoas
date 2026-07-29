import { useEffect, useState } from "react";
import type { EquipeItem } from "../types";

export type { EquipeItem } from "../types";

export function useEquipe() {
  const [itens, setItens] = useState<EquipeItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchEquipe() {
    setLoading(true);
    try {
      const [comRes, lidRes] = await Promise.all([
        fetch("/api/v1/backoffice/comerciais"),
        fetch("/api/v1/backoffice/liderancas"),
      ]);

      const comerciais: any[] = comRes.ok ? await comRes.json() : [];
      const liderancas: any[] = lidRes.ok ? await lidRes.json() : [];

      const equipeResponses = await Promise.all(
        liderancas.map((l) =>
          fetch(`/api/v1/backoffice/liderancas/${l.id}/equipe`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ),
      );

      const consultorPfsPorLideranca = new Map<string, any[]>();
      equipeResponses.forEach((resp, idx) => {
        if (resp?.equipe?.consultoresPf) {
          consultorPfsPorLideranca.set(liderancas[idx].id, resp.equipe.consultoresPf);
        }
      });

      const comerciaisFormatados: EquipeItem[] = comerciais.map((c) => ({
        id: c.id,
        nome: c.nome,
        cpf: c.cpf,
        email: c.email,
        status: c.status,
        funcao: c.funcao,
        tipoLideranca: c.tipoLideranca,
        kind: "comercial",
      }));

      const liderancasFormatadas: EquipeItem[] = liderancas.map((l) => {
        const consultores = consultorPfsPorLideranca.get(l.id) || [];
        return {
          id: l.id,
          nome: l.nome,
          cpf: l.cpf,
          email: l.email,
          status: l.status,
          tipo: l.tipo,
          kind: "lideranca",
          consultorPfs: consultores.map((cp: any) => ({
            id: cp.id,
            nome: cp.nome,
            cpf: cp.cpf,
            email: cp.email,
            status: cp.status,
          })),
        };
      });

      setItens([...comerciaisFormatados, ...liderancasFormatadas]);
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
