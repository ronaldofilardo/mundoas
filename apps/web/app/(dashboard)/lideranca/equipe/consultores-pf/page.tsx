"use client";

import { useState } from "react";

import Link from "next/link";

import { UploadPlanilhaConsultoresPf } from "./_components/upload-planilha-consultores-pf";
import { NovoConsultorPfModal } from "./_components/novo-consultor-pf-modal";
import { ConsultoresPfTable } from "./_components/consultores-pf-table";
import { EditarConsultorPfModal } from "./_components/editar-consultor-pf-modal";
import { useConsultoresPf } from "./hooks/use-consultores-pf";
import { useMetasConsultoresPf } from "./hooks/use-metas-consultores-pf";
import { useEdicaoConsultorPf } from "./hooks/use-edicao-consultor-pf";

export default function ConsultoresPfPage() {
  const [anoReferencia] = useState(new Date().getFullYear());
  const [novoConsultorAberto, setNovoConsultorAberto] = useState(false);

  const { consultores, loading, setoresOpcoes, alternandoId, fetchConsultores, handleAlternarStatus } =
    useConsultoresPf();
  const { metasPorConsultor, loadingMetas, handleSalvarMeta } =
    useMetasConsultoresPf(consultores);
  const {
    editando,
    editNome,
    setEditNome,
    editEmail,
    setEditEmail,
    editCpf,
    setEditCpf,
    editTelefone,
    setEditTelefone,
    editSetores,
    salvandoEdicao,
    abrirEdicao,
    toggleEditSetor,
    fecharEdicao,
    handleSalvarEdicao,
  } = useEdicaoConsultorPf(fetchConsultores);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="font-sans space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/lideranca/equipe" className="text-gray-600 hover:text-gray-900">
              ←
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Consultores PF</h1>
          </div>
          <p className="text-sm text-gray-500">
            Gerencie seus {consultores.length} consultores PF
          </p>
        </div>
        <div className="flex gap-2">
          <UploadPlanilhaConsultoresPf />
          <button
            type="button"
            aria-label="Abrir cadastro de novo Consultor PF"
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
            onClick={() => setNovoConsultorAberto(true)}
          >
            Novo Consultor PF
          </button>
        </div>
      </div>

      <div className="card">
        <ConsultoresPfTable
          consultores={consultores}
          metasPorConsultor={metasPorConsultor}
          anoReferencia={anoReferencia}
          alternandoId={alternandoId}
          onEditar={abrirEdicao}
          onAlternarStatus={handleAlternarStatus}
          onSalvarMeta={handleSalvarMeta}
        />
        {loadingMetas && consultores.length > 0 && (
          <p className="text-xs text-gray-400 p-2">Carregando metas...</p>
        )}
      </div>

      <NovoConsultorPfModal
        open={novoConsultorAberto}
        setoresOpcoes={setoresOpcoes}
        onClose={() => setNovoConsultorAberto(false)}
        onCreated={fetchConsultores}
      />

      {editando && (
        <EditarConsultorPfModal
          editando={editando}
          editNome={editNome}
          editEmail={editEmail}
          editCpf={editCpf}
          editTelefone={editTelefone}
          editSetores={editSetores}
          setoresOpcoes={setoresOpcoes}
          salvando={salvandoEdicao}
          onNomeChange={setEditNome}
          onEmailChange={setEditEmail}
          onCpfChange={setEditCpf}
          onTelefoneChange={setEditTelefone}
          onToggleSetor={toggleEditSetor}
          onCancel={fecharEdicao}
          onSalvar={handleSalvarEdicao}
        />
      )}
    </div>
  );
}