import { formatCpf } from "../utils/format-cpf";
import type { IndicadoCpfValidation, IndicarForm } from "../types";

type IndicarClienteModalProps = {
  indicarForm: IndicarForm;
  indicarLoading: boolean;
  indicadoCpfValidation: IndicadoCpfValidation;
  onChange: (field: keyof IndicarForm, value: string) => void;
  onCpfChange: (cpf: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function IndicarClienteModal({
  indicarForm,
  indicarLoading,
  indicadoCpfValidation,
  onChange,
  onCpfChange,
  onClose,
  onSubmit,
}: IndicarClienteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Indicar Cliente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Vincule um cliente ao seu CPF para receber pontos sobre os
          procedimentos realizados.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="indicacao-cpf-parceiro"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              CPF do Parceiro (Meu)
            </label>
            <input
              id="indicacao-cpf-parceiro"
              type="text"
              required
              maxLength={14}
              value={indicarForm.cpfParceiro}
              onChange={(e) =>
                onChange("cpfParceiro", formatCpf(e.target.value))
              }
              placeholder="000.000.000-00"
              className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
            />
          </div>

          <div>
            <label
              htmlFor="indicacao-nome-cliente"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nome do Cliente
            </label>
            <input
              id="indicacao-nome-cliente"
              type="text"
              required
              value={indicarForm.nomeIndicado}
              onChange={(e) => onChange("nomeIndicado", e.target.value)}
              placeholder="Nome completo do cliente"
              className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
            />
          </div>

          <div>
            <label
              htmlFor="indicacao-cpf-cliente"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              CPF do Cliente
            </label>
            <input
              id="indicacao-cpf-cliente"
              type="text"
              required
              maxLength={14}
              value={indicarForm.cpfIndicado}
              onChange={(e) => {
                const formatted = formatCpf(e.target.value);
                onChange("cpfIndicado", formatted);
                onCpfChange(formatted);
              }}
              placeholder="000.000.000-00"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus-ring ${
                indicadoCpfValidation === "invalid"
                  ? "border-red-500"
                  : indicadoCpfValidation === "valid"
                    ? "border-green-500"
                    : ""
              }`}
            />
            {indicadoCpfValidation === "invalid" && (
              <p className="text-xs text-red-600 mt-1">CPF indisponível</p>
            )}
            {indicadoCpfValidation === "valid" && (
              <p className="text-xs text-green-600 mt-1">✓ CPF disponível</p>
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
                indicarLoading ||
                indicadoCpfValidation === "invalid" ||
                !indicarForm.cpfIndicado ||
                indicadoCpfValidation !== "valid"
              }
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {indicarLoading ? "Salvando..." : "Indicar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}