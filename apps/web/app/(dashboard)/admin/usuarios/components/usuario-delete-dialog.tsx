import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { DeleteInfo } from "../types";

interface UsuarioDeleteDialogProps {
  open: boolean;
  deleteInfo: DeleteInfo | null;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function UsuarioDeleteDialog({
  open,
  deleteInfo,
  deleting,
  onOpenChange,
  onConfirm,
}: UsuarioDeleteDialogProps) {
  const comissoesCount = deleteInfo?.info?.comissoesCount ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover {deleteInfo?.usuario?.nome}?
          </DialogDescription>
        </DialogHeader>

        {deleteInfo && (
          <div className="space-y-3 py-4">
            {comissoesCount > 0 && (
              <div className="rounded-md bg-yellow-50 p-3 text-sm">
                <p className="font-medium text-yellow-800">
                  ⚠️ {comissoesCount} comissão(ões)
                </p>
                <p className="text-yellow-700 text-xs mt-1">
                  Todas as comissões pendentes serão pagas automaticamente
                </p>
              </div>
            )}

            {comissoesCount === 0 && (
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
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? (
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
  );
}