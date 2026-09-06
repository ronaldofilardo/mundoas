import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { Usuario, UsuarioForm } from "../types";
import { EditFormField } from "./edit-form-fields";
import { BackofficeFields } from "./backoffice-fields";

interface UsuarioEditModalProps {
  open: boolean;
  usuario: Usuario | null;
  form: UsuarioForm;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onFieldChange: (field: keyof UsuarioForm, value: string) => void;
  onSave: () => void;
}

export function UsuarioEditModal({
  open,
  usuario,
  form,
  saving,
  onOpenChange,
  onFieldChange,
  onSave,
}: UsuarioEditModalProps) {
  const isBackoffice = usuario?.tipo === "BACKOFFICE";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Editar {isBackoffice ? "Unidade" : "Usuário"}
          </DialogTitle>
          <DialogDescription>{usuario?.nome}</DialogDescription>
        </DialogHeader>

        {usuario && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <EditFormField
                id="edit-nome"
                label="Nome"
                value={form.nome}
                onChange={(v) => onFieldChange("nome", v)}
              />
              <EditFormField
                id="edit-email"
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => onFieldChange("email", v)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <EditFormField
                id="edit-telefone"
                label="Telefone"
                value={form.telefone}
                onChange={(v) => onFieldChange("telefone", v)}
              />
              {isBackoffice && (
                <div>
                  <label
                    htmlFor="edit-cpf"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    CPF
                  </label>
                  <Input id="edit-cpf" value={usuario.cpf || ""} disabled />
                </div>
              )}
            </div>

            {isBackoffice && (
              <BackofficeFields
                usuario={usuario}
                form={form}
                onFieldChange={onFieldChange}
              />
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? (
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
  );
}