import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Key, Trash2, Pencil } from "lucide-react";
import type { Usuario } from "../types";
import { getTipoColor, getStatusColor } from "../utils";

interface UsuariosTableProps {
  usuarios: Usuario[];
  onEdit: (usuario: Usuario) => void;
  onResetPassword: (usuario: Usuario) => void;
  onDelete: (usuario: Usuario) => void;
}

export function UsuariosTable({
  usuarios,
  onEdit,
  onResetPassword,
  onDelete,
}: UsuariosTableProps) {
  return (
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
                  onClick={() => onEdit(usuario)}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onResetPassword(usuario)}
                  className="gap-2"
                >
                  <Key className="h-4 w-4" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(usuario)}
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
  );
}