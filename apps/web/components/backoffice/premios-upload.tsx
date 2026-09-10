"use client";

import { usePremiosUploadHook } from "./use-premios-upload-hook";
import { PremiosUploadView } from "./premios-upload-view";

export function PremiosUpload({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const {
    file,
    preview,
    summary,
    loading,
    uploading,
    feedback,
    catalogoUrl,
    setCatalogoUrl,
    savingCatalogUrl,
    handlePreview,
    handleFileChange,
    handleUpload,
    handleSaveCatalogoUrl,
    handleDownloadModelo,
    handleReset,
    tipoLabels,
  } = usePremiosUploadHook({ onSuccess });

  return (
    <PremiosUploadView
      file={file}
      preview={preview}
      summary={summary}
      loading={loading}
      uploading={uploading}
      feedback={feedback}
      catalogoUrl={catalogoUrl}
      setCatalogoUrl={setCatalogoUrl}
      savingCatalogUrl={savingCatalogUrl}
      handlePreview={handlePreview}
      handleFileChange={handleFileChange}
      handleUpload={handleUpload}
      handleSaveCatalogoUrl={handleSaveCatalogoUrl}
      handleDownloadModelo={handleDownloadModelo}
      handleReset={handleReset}
      tipoLabels={tipoLabels}
      onSuccess={onSuccess}
    />
  );
}