"use client";

import { useUploads } from "@/app/(dashboard)/backoffice/uploads/hooks/use-uploads";
import UploadForm from "@/app/(dashboard)/backoffice/uploads/components/upload-form";
import UploadPreview from "@/app/(dashboard)/backoffice/uploads/components/upload-preview";
import UploadHistory from "@/app/(dashboard)/backoffice/uploads/components/upload-history";

import type { Upload } from "@/app/(dashboard)/backoffice/uploads/types";

export default function BackofficeUploads() {
  const {
    uploads,
    loading,
    uploading,
    file,
    mesReferencia,
    fileInputRef,
    preview,
    previewLoading,
    showConfirm,
    formatDate,
    formatMes,
    formatCpf,
    handlePreview,
    handleConfirmImport,
    cancelPreview,
  } = useUploads();

  return (
    <div className="w-full max-w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload Planilha</h1>
        <p className="text-gray-500 text-sm">
          Importar Receita Bruta Analítica para cálculo de comissões
        </p>
      </div>

      <UploadForm
        file={file}
        setFile={f => {}}
        mesReferencia={mesReferencia}
        setMesReferencia={setMesReferencia => {}}
        handlePreview={handlePreview}
        handleConfirmImport={handleConfirmImport}
        uploading={uploading}
        showConfirm={showConfirm}
        fileInputRef={fileInputRef}
        cancelPreview={cancelPreview}
      />

      <UploadPreview
        preview={preview}
        showConfirm={showConfirm}
        formatMes={formatMes}
        formatCpf={formatCpf}
        formatDate={formatDate}
      />

      <UploadHistory
        uploads={uploads}
        loading={loading}
        formatDate={formatDate}
        formatMes={formatMes}
        formatCpf={formatCpf}
      />
    </div>
  );
}