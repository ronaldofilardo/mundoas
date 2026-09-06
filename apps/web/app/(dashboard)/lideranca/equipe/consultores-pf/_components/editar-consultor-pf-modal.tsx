"use client";

import type { ConsultorPf } from "../types";

interface EditarConsultorPfModalProps {
  editando: ConsultorPf;
  editNome: string;
  editEmail: string;
  editCpf: string;
  editTelefone: string;
  editSetores: string[];
  setoresOpcoes: string[];
  salvando: boolean;
  onNomeChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onCpfChange: (value: string) => void;
  onTelefoneChange: (value: string) => void;
  onToggleSetor: (nome: string) => void;
  onCancel: () => void;
  onSalvar: () => void;
}

export function EditarConsultorPfModal({
  editando,
  editNome,
  editEmail,
  editCpf,
  editTelefone,
  editSetores,
  setoresOpcoes,
  salvando,
  onNomeChange,
  onEmailChange,
  onCpfChange,
  onTelefoneChange,
  onToggleSetor,
  onCancel,
  onSalvar,
}: EditarConsultorPfModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900">Editar consultor</h2>
        <div className="space-y-3">
          <div>
            <label htmlFor="edit-nome" className="block text-sm font-medium text-gray-700">
              Nome
            </label>
            <input
              id="edit-nome"
              type="text"
              value={editNome}
              onChange={(e) => onNomeChange(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="edit-email"
              type="email"
              value={editEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label htmlFor="edit-cpf" className="block text-sm font-medium text-gray-700">
              CPF
            </label>
            <input
              id="edit-cpf"
              type="text"
              value={editCpf}
              onChange={(e) => onCpfChange(e.target.value)}
              maxLength={14}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label htmlFor="edit-telefone" className="block text-sm font-medium text-gray-700">
              Telefone
            </label>
            <input
              id="edit-telefone"
              type="text"
              value={editTelefone}
              onChange={(e) => onTelefoneChange(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-700">
              Setores
            </span>
            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Array.from(new Set([...setoresOpcoes, ...editSetores])).map((nome) => {
                const checked = editSetores.includes(nome);
                return (
                  <label
                    key={nome}
                    className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                      checked
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleSetor(nome)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span>{nome}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={salvando}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSalvar}
            disabled={salvando}
            className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}