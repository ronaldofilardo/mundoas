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
import { Loader2, Key, Trash2, Eye, MoreHorizontal } from "lucide-react";
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
  telefone: string | null;
  cpf: string | null;
  tipo: "GESTOR" | "CONSULTOR" | "BACKOFFICE";
  status: "ATIVO" | "INATIVO";
  papel: string | null;
  hierarquia: "GESTOR" | "CONSULTOR" | "BACKOFFICE";
  criadoEm?: string;
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

  const handleDeleteClick = async (usuario: Usuario) => {
    try {
      // Fetch delete info (comissões, estabelecimentos, etc)
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
            deleteEstabelecimentos: true,
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [showDetails, setShowDetails] = useState<string | null>(null);

  const handleDetailsClick = (id: string) => {
    setShowDetails(showDetails === id ? null : id);
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
          Gerencie usuários administrativos, consultores e backoffices ({usuarios.length}{" "}
          total)
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario) => (
              <>
                <TableRow key={`${usuario.tipo}-${usuario.id}`}>
                  <TableCell className="font-medium">{usuario.nome}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {usuario.email}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {usuario.telefone || "—"}
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
                  <TableCell className="text-sm text-gray-600">
                    {usuario.papel || "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(usuario.status)}`}
                    >
                      {usuario.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(usuario.criadoEm)}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDetailsClick(usuario.id)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Detalhes
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
                {showDetails === usuario.id && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-4 bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                        <div>
                          <p className="text-xs text-gray-500">ID Usuário</p>
                          <p className="font-mono text-sm">{usuario.usuarioId || usuario.id}</p>
                        </div>
                        {usuario.tipo === "BACKOFFICE" && (
                          <>
                            <div>
                              <p className="text-xs text-gray-500">% Comissão Padrão</p>
                              <p className="font-medium">{usuario.percentualComissaoDefault}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">% Comissão Máx</p>
                              <p className="font-medium">{usuario.percentualComissaoMax}%</p>
                            </div>
                          </>
                        )}
                        <div>
                          <p className="text-xs text-gray-500">Papel</p>
                          <p className="font-medium">{usuario.papel || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Hierarquia</p>
                          <p className="font-medium">{usuario.hierarquia}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-500">Cadastrado em</p>
                          <p className="font-medium">{formatDate(usuario.criadoEm)}</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
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
              {deleteInfo.usuario.tipo === "CONSULTOR" && deleteInfo.info?.comissoesCount > 0 && (
                <div className="rounded-md bg-yellow-50 p-3 text-sm">
                  <p className="font-medium text-yellow-800">
                    ⚠️ {deleteInfo.info.comissoesCount} comissão(ões)
                  </p>
                  <p className="text-yellow-700 text-xs mt-1">
                    Todas as comissões pendentes serão pagas automaticamente
                  </p>
                </div>
              )}

              {deleteInfo.usuario.tipo === "BACKOFFICE" && deleteInfo.info?.info && (
                <div className="space-y-2">
                  <p className="font-medium text-amber-800">
                    ⚠️ O backoffice possui os seguintes dados vinculados:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-amber-700">
                    {deleteInfo.info.info.assinaturasCount > 0 && (
                      <div>• {deleteInfo.info.info.assinaturasCount} assinatura(s)</div>
                    )}
                    {deleteInfo.info.info.ciclosPontosCount > 0 && (
                      <div>• {deleteInfo.info.info.ciclosPontosCount} ciclo(s) de pontos</div>
                    )}
                    {deleteInfo.info.info.configuracoesPontosCount > 0 && (
                      <div>• {deleteInfo.info.info.configuracoesPontosCount} config. de pontos</div>
                    )}
                    {deleteInfo.info.info.equipeCount > 0 && (
                      <div>• {deleteInfo.info.info.equipeCount} membro(s) da equipe</div>
                    )}
                    {deleteInfo.info.info.parceirosCount > 0 && (
                      <div>• {deleteInfo.info.info.parceirosCount} parceiro(s)</div>
                    )}
                    {deleteInfo.info.info.premiosCount > 0 && (
                      <div>• {deleteInfo.info.info.premiosCount} prêmio(s)</div>
                    )}
                    {deleteInfo.info.info.regrasComerciaisCount > 0 && (
                      <div>• {deleteInfo.info.info.regrasComerciaisCount} regra(s) comercial</div>
                    )}
                    {deleteInfo.info.info.regrasFaltasCount > 0 && (
                      <div>• {deleteInfo.info.info.regrasFaltasCount} regra(s) de faltas</div>
                    )}
                    {deleteInfo.info.info.regrasGestoresCount > 0 && (
                      <div>• {deleteInfo.info.info.regrasGestoresCount} regra(s) de gestores</div>
                    )}
                    {deleteInfo.info.info.setoresCount > 0 && (
                      <div>• {deleteInfo.info.info.setoresCount} setor(es)</div>
                    )}
                  </div>
                  <p className="text-amber-700 text-xs mt-2">
                    Total: {deleteInfo.info.info.totalVinculos} vínculo(s). Todos serão removidos.
                  </p>
                </div>
              )}

              {deleteInfo.usuario.tipo !== "BACKOFFICE" && deleteInfo.info?.comissoesCount === 0 && deleteInfo.info?.estabelecimentosCount === 0 && (
                <div className="rounded-md bg-green-50 p-3 text-sm">
                  <p className="text-green-700">
                    ✓ Nenhum dado vinculado a remover
                  </p>
                </div>
              )}

              {deleteInfo.usuario.tipo === "BACKOFFICE" && deleteInfo.info?.info?.totalVinculos === 0 && (
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
    </div>
  );
}
