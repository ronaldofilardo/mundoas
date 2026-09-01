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
    razaoSocial: "",
    cnpj: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    telefone: "",
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
    } catch (error: unknown) {
      toast.error((error instanceof Error ? error.message : "Erro inesperado") || "Erro ao criar unidade");
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
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nome">
            Nome da unidade
          </label>
          <input id="nome"
            name="nome"
            required
            value={formData.nome}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Ex: Unidade Centro"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
            Email de acesso
          </label>
          <input id="email"
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
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cpf">
            CPF do responsável
          </label>
          <input id="cpf"
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

        <h3 className="text-xs font-medium text-gray-500 mb-2">Dados da Pessoa Jurídica</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="razaoSocial">
            Razão Social
          </label>
          <input id="razaoSocial"
            name="razaoSocial"
            value={formData.razaoSocial}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Nome empresarial"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cnpj">
            CNPJ
          </label>
          <input id="cnpj"
            name="cnpj"
            value={formData.cnpj}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Somente números"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cep">
              CEP
            </label>
            <input id="cep"
              name="cep"
              value={formData.cep}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Somente números"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="uf">
              UF
            </label>
            <input id="uf"
              name="uf"
              value={formData.uf}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Ex: SP"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="logradouro">
              Logradouro
            </label>
            <input id="logradouro"
              name="logradouro"
              value={formData.logradouro}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Ex: Rua Principal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="numero">
              Número
            </label>
            <input id="numero"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Ex: 100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="complemento">
            Complemento
          </label>
          <input id="complemento"
            name="complemento"
            value={formData.complemento}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Ex: Apto 101"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="bairro">
            Bairro
          </label>
          <input id="bairro"
            name="bairro"
            value={formData.bairro}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Ex: Centro"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cidade">
              Cidade
            </label>
            <input id="cidade"
              name="cidade"
              value={formData.cidade}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Ex: São Paulo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="telefone">
              Telefone
            </label>
            <input id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Somente números"
            />
          </div>
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
