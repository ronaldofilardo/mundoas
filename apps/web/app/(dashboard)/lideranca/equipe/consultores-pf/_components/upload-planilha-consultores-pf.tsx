"use client";

import { useUploadConsultoresPf } from "../hooks/use-upload-consultores-pf";
import { PreviewTable } from "@/components/lideranca/upload/preview-table";
import { ResultTable } from "@/components/lideranca/upload/result-table";

export function UploadPlanilhaConsultoresPf() {
  const {
    open,
    loading,
    arquivo,
    linhas,
    resultado,
    setoresValidos,
    inputRef,
    linhasValidas,
    setOpen,
    resetar,
    fechar,
    handleFileChange,
    handleImportar,
    baixarModelo,
  } = useUploadConsultoresPf();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-white text-green-700 border border-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Upload de Planilha
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Upload de Planilha — Consultores PF
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Cada linha cria um consultor PF vinculado à sua liderança, com os
              mesmos campos do cadastro manual.
            </p>
          </div>
          <button
            type="button"
            onClick={fechar}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <p className="font-semibold mb-1">Formato esperado da planilha:</p>
            <p>
              Colunas obrigatórias: <strong>Nome, Email, CPF, Setores</strong>.
              Coluna opcional: <strong>Telefone</strong>.
            </p>
            <p className="mt-1">
              <strong>Setores:</strong> separe múltiplos valores por{" "}
              <code>;</code>, <code>,</code> ou <code>|</code>. Valores
              permitidos: {setoresValidos.join(", ")}.
            </p>
            <p className="mt-1">
              Formatos aceitos: <strong>.xlsx, .xls, .csv</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={baixarModelo}
              className="text-xs text-green-700 hover:text-green-900 underline"
            >
              Baixar modelo .xlsx
            </button>
            <span className="text-xs text-gray-400">•</span>
            <label className="text-xs cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg">
              {arquivo ? arquivo.name : "Selecionar arquivo..."}
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {arquivo && (
              <button
                type="button"
                onClick={resetar}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Remover
              </button>
            )}
          </div>

          {linhas.length > 0 && !resultado && (
            <PreviewTable linhas={linhas} setoresValidos={setoresValidos} />
          )}

          {resultado && <ResultTable resultado={resultado} />}
        </div>

        <div className="flex gap-3 p-5 border-t bg-gray-50">
          <button
            type="button"
            onClick={fechar}
            className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleImportar}
            disabled={loading || !arquivo || linhas.length === 0 || !!resultado}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Importando..."
              : `Importar ${linhasValidas} consultor(es)`}
          </button>
        </div>
      </div>
    </div>
  );
}