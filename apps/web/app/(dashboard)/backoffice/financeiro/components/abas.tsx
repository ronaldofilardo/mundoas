import type { AbaFinanceiro } from "../page";

interface AbasFinanceiroProps {
  active: AbaFinanceiro;
  onChange: (aba: AbaFinanceiro) => void;
}

export function AbasFinanceiro({ active, onChange }: AbasFinanceiroProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-1" aria-label="Abas financeiro">
        <button
          type="button"
          onClick={() => onChange("mensalidade")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            active === "mensalidade"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Mensalidade
        </button>
        <button
          type="button"
          onClick={() => onChange("conta")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            active === "conta"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Conta
        </button>
      </nav>
    </div>
  );
}
