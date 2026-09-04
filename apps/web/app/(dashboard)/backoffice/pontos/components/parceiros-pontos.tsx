"use client";

import { useState } from "react";
import { useParceirosData } from "../hooks/use-parceiros-data";
import { useParceiroForm } from "../hooks/use-parceiro-form";
import { useUpload } from "../hooks/use-upload";
import { ParceirosTable } from "./parceiros-table";
import { ParceiroModal } from "./parceiro-modal";
import { UploadModal } from "./upload-modal";

export function ParceirosPontos() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const {
    parceiros,
    loading,
    fetchParceiros,
    handleReativar,
    handleDesligar,
  } = useParceirosData();

  const {
    showModal,
    editParceiro,
    form,
    cpfValidation,
    saving,
    setForm,
    setShowModal,
    openCreate,
    openEdit,
    validateCpfRealTime,
    handleSubmit,
  } = useParceiroForm({
    onSuccess: fetchParceiros,
  });

  const {
    uploadOpen,
    setUploadOpen,
    uploadLoading,
    uploadFile,
    uploadLinhas,
    uploadResultado,
    uploadInputRef,
    resetarUpload,
    handleUploadFileChange,
    handleUploadImportar,
    baixarModeloParceiros,
  } = useUpload({
    onSuccess: fetchParceiros,
  });

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parceiros</h1>
          <p className="text-gray-500 text-sm">
            Gerencie parceiros e suas indicações
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="bg-white text-primary-600 border border-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 text-sm font-medium focus-ring flex items-center gap-2"
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
            Upload Planilha
          </button>
          <button
            onClick={openCreate}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-smooth text-sm font-medium focus-ring"
          >
            + Novo Parceiro
          </button>
        </div>
      </div>

      <ParceirosTable
        parceiros={parceiros}
        expandedIds={expandedIds}
        loading={loading}
        onToggleExpand={toggleExpand}
        onOpenCreate={openCreate}
        onOpenEdit={openEdit}
        onDesligar={handleDesligar}
        onReativar={handleReativar}
      />

      <ParceiroModal
        showModal={showModal}
        editParceiro={editParceiro}
        form={form}
        cpfValidation={cpfValidation}
        saving={saving}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onChange={setForm}
        onValidateCpf={validateCpfRealTime}
      />

      <UploadModal
        open={uploadOpen}
        uploadFile={uploadFile}
        uploadLinhas={uploadLinhas}
        uploadResultado={uploadResultado}
        uploadLoading={uploadLoading}
        onClose={() => setUploadOpen(false)}
        onFileChange={handleUploadFileChange}
        onImportar={handleUploadImportar}
        onReset={resetarUpload}
        onBaixarModelo={baixarModeloParceiros}
        inputRef={uploadInputRef}
      />
    </div>
  );
}
