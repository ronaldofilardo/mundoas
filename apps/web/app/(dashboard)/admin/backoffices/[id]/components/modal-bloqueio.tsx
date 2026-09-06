"use client";

import { useState } from "react";

interface ModalBloqueioProps {
  acaoEmAndamento: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
}

export function ModalBloqueio({ acaoEmAndamento, onClose, onConfirm }: ModalBloqueioProps) {
  const [motivo, setMotivo] = useState("");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">Bloquear acesso</h2>
        <textarea
          className="w-full border rounded px-3 py-2 text-sm"
          rows={3}
          placeholder="Motivo do bloqueio (obrigatório)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(motivo)}
            disabled={!motivo.trim() || acaoEmAndamento}
            className="px-4 py-2 rounded text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            Confirmar bloqueio
          </button>
        </div>
      </div>
    </div>
  );
}
