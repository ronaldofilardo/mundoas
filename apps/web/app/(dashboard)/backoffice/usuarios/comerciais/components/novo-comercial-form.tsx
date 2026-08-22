"use client";

import { useState } from "react";
import { toast } from "sonner";

interface NovoComercialFormProps {
  onCreated: () => void;
}

export function NovoComercialForm({ onCreated }: NovoComercialFormProps) {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [lideranca, setLideranca] = useState("");
  const [funcao, setFuncao] = useState("");
  const [loading, setLoading] = useState(false);

  const funcoesComercial = [
    "SUPERVISOR_COMERCIAL",
    "GERENTE_CIRE",
    "SUPERVISOR_ATIVO",
    "SUPERVISOR_RECEPTIVO",
  ];

  const funcoesGestor = [
    "GERENTE_CIRE",
    "SUPERVISOR_ATIVO",
    "SUPERVISOR_RECEPTIVO",
    "SUPERVISOR_FRANQUIA",
    "SUPERVISOR_ATENDIMENTO",
    "GERENTE_ATENDIMENTO",
    "SUPERVISOR_COMERCIAL",
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      toast.error("CPF deve ter 11 dígitos");
      setLoading(false);
      return;
    }

    if (lideranca && !funcao) {
      toast.error("Selecione a Função para esta liderança");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/backoffice/comerciais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          cpf: cpfDigits,
          email: email.toLowerCase().trim(),
          telefone: telefone || undefined,
          lideranca: lideranca || undefined,
          funcao: lideranca ? funcao : undefined,
          percentualComissao: 0,
        }),
      });

      let errData: { error?: string } = {};
      try {
        errData = await res.json();
      } catch { }

      if (!res.ok) {
        const msg = errData.error || `Erro ${res.status}: ${res.statusText}`;
        console.error("[NovoComercialForm] Erro ao criar:", msg, errData);
        toast.error(msg);
        alert(msg);
        return;
      }

      toast.success("Comercial criado com sucesso");
      setNome("");
      setCpf("");
      setEmail("");
      setTelefone("");
      setLideranca("");
      setFuncao("");
      onCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao criar comercial";
      console.error("[NovoComercialForm] Exceção:", err);
      toast.error(msg);
      alert(msg);
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
          <label htmlFor="novo-comercial-nome" className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            id="novo-comercial-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label htmlFor="novo-comercial-cpf" className="block text-sm font-medium text-gray-700 mb-1">
            CPF
          </label>
          <input
            id="novo-comercial-cpf"
            type="text"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            required
            placeholder="000.000.000-00"
            maxLength={14}
          />
        </div>
        <div>
          <label htmlFor="novo-comercial-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="novo-comercial-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label htmlFor="novo-comercial-telefone" className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <input
            id="novo-comercial-telefone"
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            placeholder="(00) 00000-0000"
          />
        </div>
        <div>
          <label htmlFor="novo-comercial-lideranca" className="block text-sm font-medium text-gray-700 mb-1">
            Liderança
          </label>
          <select
            id="novo-comercial-lideranca"
            value={lideranca}
            onChange={(e) => {
              setLideranca(e.target.value);
              setFuncao("");
            }}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Selecione</option>
            <option value="COMERCIAL">Comercial</option>
            <option value="GESTOR">Gestor</option>
          </select>
        </div>
        <div>
          <label htmlFor="novo-comercial-funcao" className="block text-sm font-medium text-gray-700 mb-1">
            Função
          </label>
          <select
            id="novo-comercial-funcao"
            value={funcao}
            onChange={(e) => setFuncao(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            disabled={!lideranca}
          >
            <option value="">Selecione</option>
            {lideranca === "COMERCIAL" && funcoesComercial.map((f) => (
              <option key={f} value={f}>{f.replace(/_/g, " ")}</option>
            ))}
            {lideranca === "GESTOR" && funcoesGestor.map((f) => (
              <option key={f} value={f}>{f.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading || !!(lideranca && !funcao)}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar Comercial"}
          </button>
        </div>
      </div>
    </form>
  );
}
