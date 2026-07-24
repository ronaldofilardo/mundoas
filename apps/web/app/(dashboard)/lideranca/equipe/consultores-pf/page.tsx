"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface ConsultorPf {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string | null;
  status: string;
  createdAt: string;
}

export default function ConsultoresPfPage() {
  const [consultores, setConsultores] = useState<ConsultorPf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsultores();
  }, []);

  async function fetchConsultores() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/lideranca/consultores-pf");
      if (!res.ok) throw new Error("Erro ao carregar consultores");
      const data = await res.json();
      setConsultores(data);
    } catch (error) {
      toast.error("Erro ao carregar consultores PF");
    } finally {
      setLoading(false);
    }
  }

  function formatarCpf(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function formatarData(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="font-sans space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/lideranca/equipe" className="text-gray-600 hover:text-gray-900">
              ←
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Consultores PF</h1>
          </div>
          <p className="text-sm text-gray-500">
            Gerencie seus {consultores.length} consultores PF
          </p>
        </div>
        <Link
          href="/lideranca/consultores-pf/novo"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          Novo Consultor PF
        </Link>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium text-gray-600">Nome</th>
                <th className="text-left p-2 font-medium text-gray-600">Email</th>
                <th className="text-left p-2 font-medium text-gray-600">CPF</th>
                <th className="text-left p-2 font-medium text-gray-600">Telefone</th>
                <th className="text-left p-2 font-medium text-gray-600">Status</th>
                <th className="text-left p-2 font-medium text-gray-600">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {consultores.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium text-gray-900">{c.nome}</td>
                  <td className="p-2 text-gray-600">{c.email}</td>
                  <td className="p-2 text-gray-600">{formatarCpf(c.cpf)}</td>
                  <td className="p-2 text-gray-600">{c.telefone || "-"}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        c.status === "ATIVO"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {c.status === "ATIVO" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-2 text-gray-600">{formatarData(c.createdAt)}</td>
                </tr>
              ))}

              {consultores.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Nenhum consultor PF na equipe
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
