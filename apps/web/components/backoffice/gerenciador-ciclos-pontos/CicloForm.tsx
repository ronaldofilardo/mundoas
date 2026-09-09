"use client";

import { useState } from "react";
import { CicloPontos } from "../types";

export function CicloForm({
  showForm,
  setShowForm,
  formData,
  setFormData,
  onCreate,
}: {
  showForm: boolean;
  setShowForm: (value: boolean) => void;
  formData: {
    nome: string;
    inicioAcumuloEm: string;
    fimAcumuloEm: string;
    fimResgateEm: string;
  };
  setFormData: (value: {
    nome: string;
    inicioAcumuloEm: string;
    fimAcumuloEm: string;
    fimResgateEm: string;
  }) => void;
  onCreate: () => void;
}) {
  return (
    <form
      className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Ciclo
        </label>
        <input
          type="text"
          value={formData.nome}
          onChange={(e) =>
            setFormData({ ...formData, nome: e.target.value })
          }
          placeholder="Ex: 1º Semestre 2026"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Início Acúmulo
          </label>
          <input
            type="datetime-local"
            value={formData.inicioAcumuloEm}
            onChange={(e) =>
              setFormData({ ...formData, inicioAcumuloEm: e.target.value })
            }
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fim Acúmulo
          </label>
          <input
            type="datetime-local"
            value={formData.fimAcumuloEm}
            onChange={(e) =>
              setFormData({ ...formData, fimAcumuloEm: e.target.value })
            }
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fim Resgate
          </label>
          <input
            type="datetime-local"
            value={formData.fimResgateEm}
            onChange={(e) =>
              setFormData({ ...formData, fimResgateEm: e.target.value })
            }
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          Criar Ciclo
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}