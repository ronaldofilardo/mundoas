"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface NovoConsultorPfModalProps {
  open: boolean;
  setoresOpcoes: string[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}

export function NovoConsultorPfModal({
  open,
  setoresOpcoes,
  onClose,
  onCreated,
}: NovoConsultorPfModalProps) {
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [setores, setSetores] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setNome("");
      setEmail("");
      setCpf("");
      setTelefone("");
      setSetores([]);
    }
  }, [open]);

  if (!open) return null;

  function toggleSetor(nomeSetor: string) {
    setSetores((prev) =>
      prev.includes(nomeSetor)
        ? prev.filter((item) => item !== nomeSetor)
        : [...prev, nomeSetor],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cpfLimpo = cpf.replace(/\D/g, "");

    if (nome.trim().length < 3) {
      toast.error("Nome deve ter no mínimo 3 caracteres");
      return;
    }
    if (!email.trim()) {
      toast.error("Informe um email válido");
      return;
    }
    if (cpfLimpo.length !== 11) {
      toast.error("CPF deve ter 11 dígitos");
      return;
    }
    if (setores.length === 0) {
      toast.error("Selecione ao menos um setor");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/v1/lideranca/consultores-pf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          cpf: cpfLimpo,
          telefone: telefone.trim() || undefined,
          setores,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Erro ao criar consultor PF");
      }

      toast.success(
        `Consultor PF criado com sucesso! Senha provisória: ${data?.senhaTemporaria || "informada no primeiro acesso"}`,
      );
      onClose();
      await onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar consultor PF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="novo-consultor-pf-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="novo-consultor-pf-modal-title" className="text-xl font-semibold text-gray-900">
              Novo Consultor PF
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Cadastre o consultor na equipe do seu Backoffice.
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar cadastro de Consultor PF"
            className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Nome Completo
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex: João Silva"
                required
                minLength={3}
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Email
              <input
                type="email"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Ex: joao@empresa.com"
                required
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              CPF
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={cpf}
                onChange={(event) => setCpf(event.target.value)}
                placeholder="Ex: 12345678900"
                required
                minLength={11}
                maxLength={14}
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Telefone (opcional)
              <input
                type="tel"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={telefone}
                onChange={(event) => setTelefone(event.target.value)}
                placeholder="Ex: 11999999999"
              />
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">Setores</legend>
            <p className="mt-1 text-xs text-gray-500">
              Selecione apenas setores cadastrados em Regras: Consultores para este Backoffice.
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {setoresOpcoes.map((setor) => {
                const checked = setores.includes(setor);
                return (
                  <label
                    key={setor}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      checked ? "border-green-600 bg-green-50 text-green-800" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSetor(setor)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600"
                    />
                    {setor}
                  </label>
                );
              })}
            </div>
            {setoresOpcoes.length === 0 && (
              <p className="mt-2 rounded border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                Nenhum setor está cadastrado em Regras: Consultores para este Backoffice.
              </p>
            )}
          </fieldset>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
            A senha provisória será formada pelos 5 primeiros dígitos do CPF e deverá ser alterada no primeiro acesso.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              disabled={loading || setoresOpcoes.length === 0}
            >
              {loading ? "Criando..." : "Criar Consultor PF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
