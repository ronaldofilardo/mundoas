import { useState } from "react";

interface ConsultorPfFormHeaderProps {
  isEditing: boolean;
  onClose: () => void;
}

export function ConsultorPfFormHeader({ isEditing, onClose }: ConsultorPfFormHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h2 className="text-lg font-semibold text-gray-900">
        {isEditing ? "Editar Consultor PF" : "Novo Consultor PF"}
      </h2>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 text-xl leading-none"
        aria-label="Fechar"
      >
        ×
      </button>
    </div>
  );
}