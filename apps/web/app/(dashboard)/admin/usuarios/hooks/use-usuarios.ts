"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Usuario } from "../types";
import { getErrorMessage } from "../utils";

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/admin/usuarios");

      if (!response.ok) {
        throw new Error("Erro ao carregar usuários");
      }

      const data = await response.json();
      setUsuarios(data.usuarios || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao carregar usuários"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateUsuario = useCallback(
    async (usuario: Usuario, payload: Record<string, unknown>) => {
      const response = await fetch(
        `/api/v1/admin/usuarios/${usuario.id}?type=${usuario.tipo}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro ao salvar");
      }
    },
    [],
  );

  const fetchDeleteInfo = useCallback(
    async (usuario: Usuario): Promise<{ comissoesCount: number }> => {
      const response = await fetch(
        `/api/v1/admin/usuarios/${usuario.id}/delete-info?type=${usuario.tipo}`,
      );

      if (!response.ok) {
        throw new Error("Erro ao verificar dados do usuário");
      }

      return response.json();
    },
    [],
  );

  const deleteUsuario = useCallback(async (usuario: Usuario) => {
    const response = await fetch(
      `/api/v1/admin/usuarios/${usuario.id}?type=${usuario.tipo}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payAllCommissions: true }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao deletar usuário");
    }
  }, []);

  return { usuarios, loading, refetch, updateUsuario, fetchDeleteInfo, deleteUsuario };
}