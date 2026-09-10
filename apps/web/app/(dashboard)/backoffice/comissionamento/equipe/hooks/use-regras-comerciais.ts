"use client";

import { useEffect, useState } from "react";
import type { RegrasComerciais, RegrasGestores } from "../../../usuarios/comerciais/types";
import { toast } from "sonner";

export function useRegrasComerciais() {
  const [regrasComerciais, setRegrasComerciais] = useState<RegrasComerciais | null>(null);
  const [regrasGestores, setRegrasGestores] = useState<RegrasGestores | null>(null);
  const [regrasLoading, setRegrasLoading] = useState(true);

  useEffect(() => {
    async function fetchRegras() {
      setRegrasLoading(true);
      try {
        const [comRes, gesRes] = await Promise.all([
          fetch("/api/v1/backoffice/regras-comerciais"),
          fetch("/api/v1/backoffice/regras-gestores"),
        ]);
        const comData: RegrasComerciais = comRes.ok
          ? await comRes.json()
          : {
              cartaoAcessoSaude: 0,
              cireAtivo: 0,
              cireReceptivo: 0,
              franchisingAcesso: 0,
              franchisingCartao: 0,
              unidade: 0,
            };
        const gesData: RegrasGestores = gesRes.ok
          ? await gesRes.json()
          : {
              gerenteCire: 0,
              supervisorAtivo: 0,
              supervisorReceptivo: 0,
              supervisorFranquia: 0,
              supervisorAtendimento: 0,
              gerenteAtendimento: 0,
              supervisorComercial: 0,
            };
        setRegrasComerciais(comData);
        setRegrasGestores(gesData);
      } catch {
        toast.error("Erro ao carregar regras para cálculo de comissão");
      } finally {
        setRegrasLoading(false);
      }
    }
    fetchRegras();
  }, []);

  return { regrasComerciais, regrasGestores, regrasLoading };
}