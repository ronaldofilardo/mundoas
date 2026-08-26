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
import { Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface PasswordResetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuarioId: string;
  userType: "USUARIO";
  userName: string;
  apiPath?: string;
}

export function PasswordResetModal({
  open,
  onOpenChange,
  usuarioId,
  userType,
  userName,
  apiPath = "/api/v1/gestor",
}: PasswordResetModalProps) {
  const [loading, setLoading] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateTemporaryPassword = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiPath}/usuarios/${usuarioId}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userType }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao gerar link");
      }

      const data = await response.json();
      setTemporaryPassword(data.temporaryPassword);
      toast.success("Senha temporária gerada com sucesso!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTemporaryPassword = async () => {
    if (!temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      toast.success("Senha temporária copiada para área de transferência!");

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erro ao copiar senha temporária");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset de Senha</DialogTitle>
          <DialogDescription>
            Gere uma senha temporária para {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 px-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!temporaryPassword ? (
            <Button
              onClick={handleGenerateTemporaryPassword}
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Gerando senha..." : "Gerar senha temporária"}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md bg-blue-50 p-3">
                  <p className="text-xs text-blue-600 mb-2">
                  Senha temporária — copie e envie por canal seguro:
                </p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={temporaryPassword}
                    className="text-xs bg-white"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyTemporaryPassword}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                ⚠️ O usuário deverá entrar com esta senha e alterá-la no Primeiro Acesso.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setTemporaryPassword(null);
              setError(null);
              setCopied(false);
            }}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
