import type { UploadLinha } from "./parceiros-pontos.utils";
import { UploadPreview } from "./upload-preview";
import { UploadResult } from "./upload-result";

interface UploadResultado {
  total: number;
  sucesso: number;
  erros: number;
  criados: number;
  detalhes: Array<{
    linha: number;
    nome?: string;
    status: "sucesso" | "erro";
    mensagem: string;
  }>;
}

interface UploadModalProps {
  open: boolean;
  uploadFile: File | null;
  uploadLinhas: UploadLinha[];
  uploadResultado: UploadResultado | null;
  uploadLoading: boolean;
  onClose: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImportar: () => void;
  onReset: () => void;
  onBaixarModelo: () => void;
  inputRef: React.Ref<HTMLInputElement>;
}

export function UploadModal({
  open,
  uploadFile,
  uploadLinhas,
  uploadResultado,
  uploadLoading,
  onClose,
  onFileChange,
  onImportar,
  onReset,
  onBaixarModelo,
  inputRef,
}: UploadModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Upload de Planilha — Parceiros
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Cada linha cria um parceiro com os mesmos campos do cadastro
              manual.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onReset();
            }}
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
              Colunas obrigatórias: <strong>Nome, Email, CPF</strong>.
            </p>
            <p className="mt-1">
              Formatos aceitos: <strong>.xlsx, .xls, .csv</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onBaixarModelo}
              className="text-xs text-primary-700 hover:text-primary-900 underline"
            >
              Baixar modelo .xlsx
            </button>
            <span className="text-xs text-gray-400">•</span>
            <label className="text-xs cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg">
              {uploadFile ? uploadFile.name : "Selecionar arquivo..."}
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={onFileChange}
                className="hidden"
              />
            </label>
            {uploadFile && !uploadResultado && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Remover
              </button>
            )}
          </div>

          {uploadLinhas.length > 0 && !uploadResultado && (
            <UploadPreview linhas={uploadLinhas} />
          )}

          {uploadResultado && <UploadResult resultado={uploadResultado} />}
        </div>

        <div className="flex gap-3 p-5 border-t bg-gray-50">
          <button
            type="button"
            onClick={() => {
              onClose();
              onReset();
            }}
            className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Fechar
          </button>
          {!uploadResultado && (
            <button
              type="button"
              onClick={onImportar}
              disabled={
                uploadLoading ||
                !uploadFile ||
                uploadLinhas.length === 0 ||
                uploadLinhas.every((l) => l.erros.length > 0)
              }
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadLoading
                ? "Importando..."
                : `Importar ${uploadLinhas.filter((l) => l.erros.length === 0).length} parceiro(s)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
