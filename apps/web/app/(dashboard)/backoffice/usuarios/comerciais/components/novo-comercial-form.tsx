"use client";

import { useState } from "react";
import { toast } from "sonner";

interface NovoComercialFormProps {
  onCreated: () => void;
}

const funcoes = [
  "GERENTE_CIRE",
  "SUPERVISOR_ATIVO",
  "SUPERVISOR_RECEPTIVO",
  "SUPERVISOR_FRANQUIA",
  "SUPERVISOR_ATENDIMENTO",
  "GERENTE_ATENDIMENTO",
  "SUPERVISOR_COMERCIAL",
];

export function NovoComercialForm({ onCreated }: NovoComercialFormProps) {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [lideranca, setLideranca] = useState("");
  const [tipo, setTipo] = useState("");
  const [funcao, setFuncao] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/v1/backoffice/comerciais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          cpf,
          email: email.toLowerCase().trim(),
          telefone: telefone || undefined,
          lideranca: lideranca || undefined,
          tipo: tipo || undefined,
          funcao: funcao || undefined,
          percentualComissao: 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao criar comercial");
        return;
      }

      toast.success("Comercial criado com sucesso");
      setNome("");
      setCpf("");
      setEmail("");
      setTelefone("");
      setLideranca("");
      setTipo("");
      setFuncao("");
      onCreated();
    } catch {
      toast.error("Erro ao criar comercial");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Novo Comercial
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CPF
          </label>
          <input
            type="text"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            required
            pattern="\d{11}"
            title="CPF deve ter 11 digitos"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            placeholder="(00) 00000-0000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Liderança (opcional)
          </label>
          <select
            value={lideranca}
            onChange={(e) => setLideranca(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Nenhuma</option>
            <option value="COMERCIAL">Comercial</option>
            <option value="GESTOR">Gestor</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Selecione</option>
            <option value="GERENTE">Gerente</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="LIDER">Lider</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Funcao
          </label>
          <select
            value={funcao}
            onChange={(e) => setFuncao(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Selecione</option>
            {funcoes.map((f) => (
              <option key={f} value={f}>{f.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar Comercial"}
          </button>
        </div>
      </div>
    </form>
  );
}
