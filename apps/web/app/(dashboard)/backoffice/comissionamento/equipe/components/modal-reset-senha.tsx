"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Copy, Check, KeyRound, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ModalResetSenhaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuarioNome: string;
  usuarioEmail: string;
  onConfirmReset: () => Promise<string | null>;
  initialLink?: string | null;
}

export function ModalResetSenha({
  open,
  onOpenChange,
  usuarioNome,
  usuarioEmail,
  onConfirmReset,
  initialLink = null,
}: ModalResetSenhaProps) {
  const [loading, setLoading] = useState(false);
  const [linkGerado, setLinkGerado] = useState<string | null>(initialLink);
  const [copied, setCopied] = useState(false);

  async function handleGerarLink() {
    setLoading(true);
    try {
      const link = await onConfirmReset();
      if (link) {
        setLinkGerado(link);
        try {
          await navigator.clipboard.writeText(link);
          setCopied(true);
          toast.success("Senha resetada! Link copiado para a área de transferência.");
          setTimeout(() => setCopied(false), 2500);
        } catch {
          toast.success("Senha resetada! Copie o link abaixo.");
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao resetar senha.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    if (!linkGerado) return;
    try {
      await navigator.clipboard.writeText(linkGerado);
      setCopied(true);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar link.");
    }
  }

  function handleClose() {
    onOpenChange(false);
    setLinkGerado(null);
    setCopied(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="p-6 pb-2">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mb-3 text-amber-700">
            <KeyRound className="w-5 h-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-gray-900">
            Reset de Senha
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Gerar link para <strong>{usuarioNome}</strong> ({usuarioEmail}) criar nova senha.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-4">
          {!linkGerado ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Ao confirmar, a senha atual será invalidada e será gerado um link
                exclusivo para que o colaborador possa criar uma nova senha com
                segurança.
              </p>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-800">
                ⚠️ O Backoffice deverá enviar este link por fora do sistema (WhatsApp, e-mail, etc.).
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5">
                <p className="text-xs font-semibold text-blue-900 mb-2">
                  Link de criação de nova senha:
                </p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={linkGerado}
                    className="text-xs bg-white font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="flex-shrink-0 bg-white hover:bg-gray-50"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Assim que o colaborador acessar o link e cadastrar a nova senha, o botão de cópia desaparecerá da lista.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-2 flex justify-end gap-2 border-t border-gray-100">
          <Button variant="outline" onClick={handleClose}>
            {linkGerado ? "Fechar" : "Cancelar"}
          </Button>
          {!linkGerado && (
            <Button
              onClick={handleGerarLink}
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Gerando..." : "Confirmar e Gerar Link"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
