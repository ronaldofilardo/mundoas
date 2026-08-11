"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NovoBackofficePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/v1/admin/backoffices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao criar unidade");
      }

      toast.success(
        <>
          <div>Unidade criada com sucesso!</div>
          <div className="text-xs mt-1">
            Login: <strong>{json.email}</strong>
            <br />
            Senha provisória: <strong>{json.senhaTemporaria}</strong>
            <br />
            <span className="text-gray-500">
              A unidade deve trocar a senha no primeiro acesso.
            </span>
          </div>
        </>,
        { duration: 15000 },
      );

      router.push(`/admin/backoffices/${json.id}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar unidade");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <div className="font-sans space-y-4 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nova Unidade</h1>
        <p className="text-sm text-gray-500">
          Cadastre uma nova unidade/franquia. A assinatura nasce em cortesia
          até você ativar a cobrança manualmente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome da unidade
          </label>
          <input
            name="nome"
            required
            value={formData.nome}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Ex: Unidade Centro"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email de acesso
          </label>
          <input
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="unidade@exemplo.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CPF do responsável
          </label>
          <input
            name="cpf"
            required
            value={formData.cpf}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Somente números"
          />
          <p className="text-xs text-gray-400 mt-1">
            A senha provisória será os 5 primeiros dígitos do CPF.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar unidade"}
          </button>
          <Link
            href="/admin/backoffices"
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
