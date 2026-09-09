"use client";

import { useEffect, useState } from "react";
import type { CicloPontos } from "@/components/backoffice/gerenciador-ciclos-pontos/types";

export function useGerenciadorCiclosPontos() {
  const [ciclos, setCiclos] = useState<CicloPontos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState<string | null>(
    null,
  );
  const [formData, setFormData] = useState({
    nome: "",
    inicioAcumuloEm: "",
    fimAcumuloEm: "",
    fimResgateEm: "",
  });

  useEffect(() => {
    fetchCiclos();
  }, []);

  const fetchCiclos = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/backoffice/pontos/ciclos");
      if (!response.ok) throw new Error("Erro ao carregar ciclos");
      const data = await response.json();
      setCiclos(data.ciclos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const { nome, ...rest } = formData;

  return {
    ciclos,
    loading,
    error,
    showForm,
    setShowForm,
    formData,
    setFormData,
    atualizandoStatus,
    setAtualizandoStatus,
    refetch: fetchCiclos,
  };
}