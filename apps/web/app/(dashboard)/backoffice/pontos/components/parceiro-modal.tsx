import { useEffect, useState } from "react";
import type { Parceiro, ParceiroPayload, WindowWithCpfTimeout } from "./parceiros-pontos.types";

interface ParceiroModalProps {
  showModal: boolean;
  editParceiro: Parceiro | null;
  form: ParceiroPayload;
  cpfValidation: "valid" | "invalid" | "";
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (form: ParceiroPayload) => void;
  onValidateCpf: (cpf: string) => void;
}

export function ParceiroModal({
  showModal,
  editParceiro,
  form,
  cpfValidation,
  saving,
  onClose,
  onSubmit,
  onChange,
  onValidateCpf,
}: ParceiroModalProps) {
  const [localCpf, setLocalCpf] = useState(form.cpf);

  useEffect(() => {
    setLocalCpf(form.cpf);
  }, [form.cpf]);

  if (!showModal) return null;

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    const masked = v.length > 11 ? v.slice(0, 11) : v;
    const f =
      masked.length > 9
        ? `${masked.slice(0, 3)}.${masked.slice(3, 6)}.${masked.slice(6, 9)}-${masked.slice(9)}`
        : masked.length > 6
          ? `${masked.slice(0, 3)}.${masked.slice(3, 6)}.${masked.slice(6)}`
          : masked.length > 3
            ? `${masked.slice(0, 3)}.${masked.slice(3)}`
            : masked;

    setLocalCpf(f);
    onChange({ ...form, cpf: f });

    if (masked.length === 11) {
      const windowWithTimeout = window as WindowWithCpfTimeout;
      if (windowWithTimeout.cpfTimeout) {
        clearTimeout(windowWithTimeout.cpfTimeout);
      }
      windowWithTimeout.cpfTimeout = setTimeout(() => {
        onValidateCpf(f);
      }, 500);
    } else {
      onValidateCpf("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {editParceiro ? "Editar Parceiro" : "Novo Parceiro"}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="parceiro-nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              id="parceiro-nome"
              type="text"
              required
              value={form.nome}
              onChange={(e) => onChange({ ...form, nome: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
            />
          </div>
          <div>
            <label htmlFor="parceiro-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="parceiro-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => onChange({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
            />
          </div>
          <div>
            <label htmlFor="parceiro-cpf" className="block text-sm font-medium text-gray-700 mb-1">
              CPF
            </label>
            <input
              id="parceiro-cpf"
              type="text"
              required
              maxLength={14}
              value={localCpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus-ring ${
                !editParceiro && cpfValidation === "invalid"
                  ? "border-red-500"
                  : !editParceiro && cpfValidation === "valid"
                    ? "border-green-500"
                    : ""
              }`}
            />
            {!editParceiro && cpfValidation === "invalid" && (
              <p className="text-xs text-red-600 mt-1">
                CPF inválido ou não disponível
              </p>
            )}
            {!editParceiro && cpfValidation === "valid" && (
              <p className="text-xs text-green-600 mt-1">
                ✓ CPF disponível
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                (!editParceiro &&
                  (cpfValidation === "invalid" ||
                    !form.cpf ||
                    cpfValidation !== "valid"))
              }
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "Salvando..."
                : editParceiro
                  ? "Atualizar"
                  : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
