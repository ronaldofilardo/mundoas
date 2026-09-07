"use client";

import type { MesLabel } from "../types";
import { formatarMoeda, getCorPercentual } from "../utils";

export function InputMetaCell({
  mesLabel,
  mesRef,
  valor,
  onSave,
}: {
  mesLabel: MesLabel;
  mesRef: string;
  valor: number;
  onSave: (mes: string, valor: string) => void;
}) {
  return (
    <td className="p-2">
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">R$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          defaultValue={valor > 0 ? String(valor) : ""}
          placeholder="0"
          className="w-full px-2 py-1 border rounded text-xs text-center focus:ring-2 focus:ring-green-500 focus:border-transparent"
          onBlur={(e) => {
            const val = e.target.value;
            if (val) onSave(mesRef, val);
          }}
        />
      </div>
    </td>
  );
}

export function AtingidoCell({ atingido }: { atingido: number }) {
  return (
    <td className="p-2">
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">R$</span>
        <span className="w-full px-2 py-1 border rounded text-xs text-center text-blue-600 font-medium bg-gray-50">
          {formatarMoeda(atingido)}
        </span>
      </div>
    </td>
  );
}

export function PercentualCell({ percentual }: { percentual: number }) {
  return (
    <td className="p-2">
      <span className={`${getCorPercentual(percentual)} font-bold text-sm`}>
        {percentual}%
      </span>
    </td>
  );
}