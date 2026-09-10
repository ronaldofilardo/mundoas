"use client";

import { useState, useRef } from "react";

export interface UploadFormProps {
  file: File | null;
  setFile: (f: File | null) => void;
  mesReferencia: string;
  setMesReferencia: (v: string) => void;
  handlePreview: () => void;
  handleConfirmImport: () => void;
  uploading: boolean;
  showConfirm: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  cancelPreview: () => void;
}

export default function UploadForm({
  file,
  setFile,
  mesReferencia,
  setMesReferencia,
  handlePreview,
  handleConfirmImport,
  uploading,
  showConfirm,
  fileInputRef,
  cancelPreview,
}: UploadFormProps) {
  return (
    <div className="card mb-6" style={{ width: "100%" }}>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Nova Importação</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="upload-mes-referencia" className="block text-sm font-medium text-gray-700 mb-1">
            Mês de Referência
          </label>
          <input
            id="upload-mes-referencia"
            type="month"
            required
            value={mesReferencia}
            onChange={(e) => setMesReferencia(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
            disabled={showConfirm}
          />
        </div>
        <div>
          <label htmlFor="upload-arquivo" className="block text-sm font-medium text-gray-700 mb-1">
            Arquivo (.xlsx)
          </label>
          <input
            id="upload-arquivo"
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            required
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
            }}
            className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
            disabled={showConfirm}
          />
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800 mt-4">
        <span>ℹ️</span>
        <div>
          <p className="font-medium">Colunas obrigatórias:</p>
          <p className="text-blue-600">
            Data de Referência | Data do Pagamento | Forma de Pagamento |
            Total Pago | Paciente | Procedimento | CPF | Tipo do
            Procedimento | Unidade | <strong>Usuário da conta</strong>
          </p>
          <p className="mt-1">
            Cancelamentos e devoluções são rejeitados automaticamente. A coluna
            "Usuário da conta" é obrigatória para identificar o comercial responsável.
            Linhas sem comercial válido geram pontos ao Parceiro e são contabilizadas em "linhas sem comercial".
          </p>
        </div>
      </div>

      {!showConfirm ? (
        <button
          onClick={handlePreview}
          disabled={uploading || !file}
          className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {uploading ? "Processando..." : "Visualizar Dados"}
        </button>
      ) : (
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleConfirmImport}
            disabled={uploading}
            className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Importando..." : "Confirmar Importação"}
          </button>
          <button
            onClick={cancelPreview}
            disabled={uploading}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}