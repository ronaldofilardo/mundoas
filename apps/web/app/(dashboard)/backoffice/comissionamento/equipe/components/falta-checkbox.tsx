"use client";

interface FaltaCheckboxProps {
  inputId: string;
  ariaLabel: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Exibe o texto "Falta" ao lado do checkbox (view de validação). */
  withText?: boolean;
}

export function FaltaCheckbox({ inputId, ariaLabel, checked, onChange, withText = false }: FaltaCheckboxProps) {
  return (
    <label
      htmlFor={inputId}
      className={
        withText
          ? "flex items-center gap-2 cursor-pointer text-sm text-gray-600 select-none"
          : "flex items-center justify-center cursor-pointer"
      }
    >
      <input
        id={inputId}
        type="checkbox"
        aria-label={ariaLabel}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 hover:bg-primary-50 transition-colors"
        title={checked ? "Teve faltas (clique para remover)" : "Sem faltas (clique para adicionar)"}
      />
      {withText && "Falta"}
    </label>
  );
}
