"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PasswordResetModal } from "@/components/password-reset-modal";
import type { DeleteInfo, Usuario } from "./types";
import { buildEditPayload, getErrorMessage } from "./utils";
import { useUsuarios } from "./hooks/use-usuarios";
import { useUsuarioForm } from "./hooks/use-usuario-form";
import { UsuariosTable } from "./components/usuarios-table";
import { UsuarioEditModal } from "./components/usuario-edit-modal";
import { UsuarioDeleteDialog } from "./components/usuario-delete-dialog";

export default function UsuariosPage() {
  const { usuarios, loading, refetch, updateUsuario, fetchDeleteInfo, deleteUsuario } =
    useUsuarios();

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<DeleteInfo | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUsuario, setEditUsuario] = useState<Usuario | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const { form, fillFrom, setField } = useUsuarioForm();

  const handleResetPassword = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setResetModalOpen(true);
  };

  const handleEditClick = (usuario: Usuario) => {
    setEditUsuario(usuario);
    fillFrom(usuario);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editUsuario) return;
    setSavingEdit(true);
    try {
      await updateUsuario(editUsuario, buildEditPayload(form, editUsuario.tipo));
      toast.success("Dados atualizados com sucesso");
      setEditModalOpen(false);
      setEditUsuario(null);
      await refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao salvar alterações"));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteClick = async (usuario: Usuario) => {
    try {
      const info = await fetchDeleteInfo(usuario);
      setDeleteInfo({ usuario, info });
      setDeleteDialogOpen(true);
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao preparar exclusão"));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteInfo) return;

    try {
      setDeletingId(deleteInfo.usuario.id);
      await deleteUsuario(deleteInfo.usuario);
      toast.success("Usuário deletado com sucesso");
      setDeleteDialogOpen(false);
      setDeleteInfo(null);
      await refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao deletar usuário"));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuários</h1>
        <p className="text-gray-600 mt-2">
          Gerencie usuários administrativos e consultores ({usuarios.length}{" "}
          total)
        </p>
      </div>

      <UsuariosTable
        usuarios={usuarios}
        onEdit={handleEditClick}
        onResetPassword={handleResetPassword}
        onDelete={handleDeleteClick}
      />

      {selectedUsuario && (
        <PasswordResetModal
          open={resetModalOpen}
          onOpenChange={setResetModalOpen}
          usuarioId={selectedUsuario.id}
          userType="USUARIO"
          userName={selectedUsuario.nome}
          apiPath="/api/v1/admin"
        />
      )}

      <UsuarioDeleteDialog
        open={deleteDialogOpen}
        deleteInfo={deleteInfo}
        deleting={deletingId !== null}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />

      <UsuarioEditModal
        open={editModalOpen}
        usuario={editUsuario}
        form={form}
        saving={savingEdit}
        onOpenChange={setEditModalOpen}
        onFieldChange={setField}
        onSave={handleSaveEdit}
      />
    </div>
  );
}