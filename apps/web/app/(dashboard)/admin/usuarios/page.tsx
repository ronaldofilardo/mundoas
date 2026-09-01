"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Key, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { PasswordResetModal } from "@/components/password-reset-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Usuario {
  id: string;
  usuarioId?: string;
  nome: string;
  email: string;
  cpf: string | null;
  tipo: "GESTOR" | "CONSULTOR" | "BACKOFFICE";
  status: "ATIVO" | "INATIVO";
  hierarquia: "GESTOR" | "CONSULTOR" | "BACKOFFICE";
  telefone?: string | null;
  razaoSocial?: string | null;
  cnpj?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  percentualComissaoDefault?: number;
  percentualComissaoMax?: number;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUsuario, setEditUsuario] = useState<Usuario | null>(null);
  const [editForm, setEditForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    razaoSocial: "",
    cnpj: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    percentualComissaoDefault: "",
    percentualComissaoMax: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/admin/usuarios");

      if (!response.ok) {
        throw new Error("Erro ao carregar usuários");
      }

      const data = await response.json();
      setUsuarios(data.usuarios || []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar usuários",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setResetModalOpen(true);
  };

  const handleEditClick = (usuario: Usuario) => {
    setEditUsuario(usuario);
    setEditForm({
      nome: usuario.nome || "",
      email: usuario.email || "",
      telefone: usuario.telefone || "",
      razaoSocial: usuario.razaoSocial || "",
      cnpj: usuario.cnpj || "",
      cep: usuario.cep || "",
      logradouro: usuario.logradouro || "",
      numero: usuario.numero || "",
      complemento: usuario.complemento || "",
      bairro: usuario.bairro || "",
      cidade: usuario.cidade || "",
      uf: usuario.uf || "",
      percentualComissaoDefault: usuario.percentualComissaoDefault?.toString() || "",
      percentualComissaoMax: usuario.percentualComissaoMax?.toString() || "",
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editUsuario) return;
    setSavingEdit(true);
    try {
      const response = await fetch(
        `/api/v1/admin/usuarios/${editUsuario.id}?type=${editUsuario.tipo}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: editForm.nome,
            email: editForm.email,
            telefone: editForm.telefone || null,
            ...(editUsuario.tipo === "BACKOFFICE" && {
              razaoSocial: editForm.razaoSocial || null,
              cnpj: editForm.cnpj || null,
              cep: editForm.cep || null,
              logradouro: editForm.logradouro || null,
              numero: editForm.numero || null,
              complemento: editForm.complemento || null,
              bairro: editForm.bairro || null,
              cidade: editForm.cidade || null,
              uf: editForm.uf || null,
              percentualComissaoDefault: editForm.percentualComissaoDefault
                ? parseFloat(editForm.percentualComissaoDefault)
                : undefined,
              percentualComissaoMax: editForm.percentualComissaoMax
                ? parseFloat(editForm.percentualComissaoMax)
                : undefined,
            }),
          }),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro ao salvar");
      }

      toast.success("Dados atualizados com sucesso");
      setEditModalOpen(false);
      setEditUsuario(null);
      await fetchUsuarios();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar alterações",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteClick = async (usuario: Usuario) => {
    try {
      // Fetch delete info (comissões)
      const response = await fetch(
        `/api/v1/admin/usuarios/${usuario.id}/delete-info?type=${usuario.tipo}`,
      );

      if (!response.ok) {
        throw new Error("Erro ao verificar dados do usuário");
      }

      const info = await response.json();
      setDeleteInfo({ usuario, info });
      setDeleteDialogOpen(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao preparar exclusão",
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteInfo) return;

    try {
      setDeletingId(deleteInfo.usuario.id);
      const response = await fetch(
        `/api/v1/admin/usuarios/${deleteInfo.usuario.id}?type=${deleteInfo.usuario.tipo}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payAllCommissions: true,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao deletar usuário");
      }

      toast.success("Usuário deletado com sucesso");
      setDeleteDialogOpen(false);
      setDeleteInfo(null);
      await fetchUsuarios();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao deletar usuário",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "GESTOR":
        return "bg-purple-100 text-purple-800";
      case "CONSULTOR":
        return "bg-blue-100 text-blue-800";
      case "BACKOFFICE":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "ATIVO"
      ? "bg-green-50 text-green-700"
      : "bg-red-50 text-red-700";
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

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={`${usuario.tipo}-${usuario.id}`}>
                <TableCell className="font-medium">{usuario.nome}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {usuario.email}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {usuario.cpf || "—"}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(usuario.tipo)}`}
                  >
                    {usuario.tipo}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(usuario.status)}`}
                  >
                    {usuario.status}
                  </span>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditClick(usuario)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResetPassword(usuario)}
                    className="gap-2"
                  >
                    <Key className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteClick(usuario)}
                    className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover {deleteInfo?.usuario?.nome}?
            </DialogDescription>
          </DialogHeader>

          {deleteInfo && (
            <div className="space-y-3 py-4">
              {deleteInfo.info?.comissoesCount > 0 && (
                <div className="rounded-md bg-yellow-50 p-3 text-sm">
                  <p className="font-medium text-yellow-800">
                    ⚠️ {deleteInfo.info.comissoesCount} comissão(ões)
                  </p>
                  <p className="text-yellow-700 text-xs mt-1">
                    Todas as comissões pendentes serão pagas automaticamente
                  </p>
                </div>
              )}


              {deleteInfo.info?.comissoesCount === 0 && (
                  <div className="rounded-md bg-green-50 p-3 text-sm">
                    <p className="text-green-700">
                      ✓ Nenhum dado vinculado a remover
                    </p>
                  </div>
                )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletingId !== null}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletingId !== null}
            >
              {deletingId !== null ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover usuário"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Editar {editUsuario?.tipo === "BACKOFFICE" ? "Unidade" : "Usuário"}
            </DialogTitle>
            <DialogDescription>
              {editUsuario?.nome}
            </DialogDescription>
          </DialogHeader>

          {editUsuario && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <Input
                    value={editForm.nome}
                    onChange={(e) =>
                      setEditForm({ ...editForm, nome: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <Input
                    value={editForm.telefone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, telefone: e.target.value })
                    }
                  />
                </div>
                {editUsuario.tipo === "BACKOFFICE" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      CPF
                    </label>
                    <Input value={editUsuario.cpf || ""} disabled />
                  </div>
                )}
              </div>

              {editUsuario.tipo === "BACKOFFICE" && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Dados da Unidade
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Razão Social
                        </label>
                        <Input
                          value={editForm.razaoSocial}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              razaoSocial: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          CNPJ
                        </label>
                        <Input
                          value={editForm.cnpj}
                          onChange={(e) =>
                            setEditForm({ ...editForm, cnpj: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Endereço
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Logradouro
                        </label>
                        <Input
                          value={editForm.logradouro}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              logradouro: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Número
                        </label>
                        <Input
                          value={editForm.numero}
                          onChange={(e) =>
                            setEditForm({ ...editForm, numero: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Complemento
                        </label>
                        <Input
                          value={editForm.complemento}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              complemento: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Bairro
                        </label>
                        <Input
                          value={editForm.bairro}
                          onChange={(e) =>
                            setEditForm({ ...editForm, bairro: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          CEP
                        </label>
                        <Input
                          value={editForm.cep}
                          onChange={(e) =>
                            setEditForm({ ...editForm, cep: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Cidade
                        </label>
                        <Input
                          value={editForm.cidade}
                          onChange={(e) =>
                            setEditForm({ ...editForm, cidade: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          UF
                        </label>
                        <Input
                          value={editForm.uf}
                          maxLength={2}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              uf: e.target.value.toUpperCase(),
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={savingEdit}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
