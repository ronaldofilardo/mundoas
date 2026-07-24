"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NovoConsultorPfPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("[NovoConsultorPf] Enviando dados:", formData);

      const res = await fetch("/api/v1/lideranca/consultores-pf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          telefone: formData.telefone || undefined,
        }),
      });

      console.log("[NovoConsultorPf] Status da resposta:", res.status);

      const json = await res.json();
      console.log("[NovoConsultorPf] Resposta:", json);

      if (!res.ok) {
        throw new Error(json.error || "Erro ao criar consultor PF");
      }

      toast.success(
        <>
          <div>Consultor PF criado com sucesso!</div>
          <div className="text-xs mt-1">
            Senha provisória: <strong>{json.senhaTemporaria}</strong>
          </div>
        </>
      );

      router.push("/lideranca/equipe/consultores-pf");
    } catch (error: any) {
      console.error("[NovoConsultorPf] Erro:", error);
      toast.error(error.message || "Erro ao criar consultor PF");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  return (
    <div className="font-sans space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Consultor PF</h1>
          <p className="text-sm text-gray-500">
            Adicione um novo consultor PF à sua equipe
          </p>
        </div>
        <Link
          href="/lideranca/equipe/consultores-pf"
          className="text-gray-600 hover:text-gray-900"
        >
          ← Voltar
        </Link>
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Ex: João Silva"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Ex: joao@empresa.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF
            </label>
            <input
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Ex: 12345678900"
              required
              minLength={11}
              maxLength={14}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone (opcional)
            </label>
            <input
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Ex: 11999999999"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong>
            </p>
            <ul className="text-xs text-yellow-700 mt-1 space-y-1">
              <li>• A senha provisória será os 5 primeiros dígitos do CPF</li>
              <li>• O usuário deverá trocar a senha no primeiro acesso</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar Consultor PF"}
            </button>
            <Link
              href="/lideranca/equipe/consultores-pf"
              className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
