"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  TERMO_USO_PLATAFORMA,
  POLITICA_PRIVACIDADE_LGPD,
  AUTORIZACAO_DEBITO_RECORRENTE,
} from "@/lib/legal/mundoas-termos";

type DocKey = "uso" | "privacidade" | "debito";

const DOCS: Array<{ key: DocKey; titulo: string; texto: string }> = [
  { key: "uso", titulo: "Termos de Uso da Plataforma mundoAS", texto: TERMO_USO_PLATAFORMA },
  { key: "privacidade", titulo: "Política de Privacidade e Tratamento de Dados (LGPD)", texto: POLITICA_PRIVACIDADE_LGPD },
  { key: "debito", titulo: "Autorização de Débito Recorrente", texto: AUTORIZACAO_DEBITO_RECORRENTE },
];

export default function OnboardingTermosPage() {
  const router = useRouter();
  const [aceites, setAceites] = useState<Record<DocKey, boolean>>({
    uso: false,
    privacidade: false,
    debito: false,
  });
  const [aberto, setAberto] = useState<DocKey | null>(null);
  const [loading, setLoading] = useState(false);

  const todosAceitos = aceites.uso && aceites.privacidade && aceites.debito;

  async function handleContinuar() {
    if (!todosAceitos) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/backoffice/onboarding/termos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          aceiteTermosUso: aceites.uso,
          aceitePrivacidade: aceites.privacidade,
          aceiteDebitoRecorrente: aceites.debito,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Não foi possível registrar o aceite.");
        return;
      }
      router.push("/onboarding/plano-pagamento");
    } catch {
      toast.error("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-primary-600" />
          <div className="w-2 h-2 rounded-full bg-gray-200" />
          <div className="w-2 h-2 rounded-full bg-gray-200" />
          <span className="text-xs text-gray-400 ml-1">Etapa 1 de 2</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Antes de continuar</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Para ativar sua unidade na plataforma mundoAS, é necessário ler e aceitar os documentos abaixo.
        </p>

        <div className="space-y-3">
          {DOCS.map((doc) => (
            <div key={doc.key} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setAberto(aberto === doc.key ? null : doc.key)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left"
              >
                <span className="text-sm font-semibold text-gray-800">{doc.titulo}</span>
                <span className="text-xs text-primary-600 font-medium">
                  {aberto === doc.key ? "Fechar" : "Ler documento"}
                </span>
              </button>
              {aberto === doc.key && (
                <div className="px-4 py-4 max-h-64 overflow-y-auto bg-white border-t border-gray-100">
                  <pre className="whitespace-pre-wrap text-xs text-gray-600 font-sans leading-relaxed">
                    {doc.texto}
                  </pre>
                </div>
              )}
              <label className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aceites[doc.key]}
                  onChange={(e) => setAceites((prev) => ({ ...prev, [doc.key]: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-200"
                />
                <span className="text-sm text-gray-700">Li e aceito este documento</span>
              </label>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleContinuar}
          disabled={!todosAceitos || loading}
          className="w-full mt-6 py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Salvando..." : "Aceitar e Continuar"}
        </button>
      </div>
    </div>
  );
}
