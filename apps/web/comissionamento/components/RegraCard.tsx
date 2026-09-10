"use client";

import { RegraItem } from "@/app/(dashboard)/backoffice/usuarios/comerciais/types";

interface RegraCardProps {
  label: string;
  value: number;
  onChange: (value: string) => void;
  onDelete?: () => void;
}

export function RegraCard({ label, value, onChange, onDelete }: RegraCardProps) {
  return (
    <div className="rounded border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-800">{label}</p>
        {onDelete && (
          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            onClick={onDelete}
            title="Excluir"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">Taxa: {value.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}%</p>
      <input
        type="number"
        step="0.0001"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full px-3 py-2 border rounded text-sm"
      />
    </div>
  );
}