"use client";

import { useState } from "react";

interface ModalCortesiaProps {
  acaoEmAndamento: boolean;
  onClose: () => void;
  onConfirm: (motivo: string, expiraEm: string | undefined) => void;
}

export function ModalCortesia({ acaoEmAndamento, onClose, onConfirm }: ModalCortesiaProps) {
  const [motivo, setMotivo] = useState("");
  const [expiraEm, setExpiraEm] = useState("");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">Conceder cortesia</h2>
        <textarea
          className="w-full border rounded px-3 py-2 text-sm"
          rows={3}
          placeholder="Motivo (opcional)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
        <div>
          <label className="block text-xs text-gray-500 mb-1" htmlFor="expiraEm">
            Expira em (opcional)
          </label>
          <input id="expiraEm"
            type="date"
            className="w-full border rounded px-3 py-2 text-sm"
            value={expiraEm}
            onChange={(e) => setExpiraEm(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(motivo, expiraEm || undefined)}
            disabled={acaoEmAndamento}
            className="px-4 py-2 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Confirmar cortesia
          </button>
        </div>
      </div>
    </div>
  );
}
