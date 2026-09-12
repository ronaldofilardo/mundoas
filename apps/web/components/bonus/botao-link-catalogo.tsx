"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

function formatUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function BotaoLinkCatalogo() {
  const [catalogoUrl, setCatalogoUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function carregarUrl() {
      try {
        const res = await fetch("/api/v1/backoffice/pontos/premios/catalogo-url");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.catalogoUrl) {
            setCatalogoUrl(data.catalogoUrl);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar link do catálogo:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void carregarUrl();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAbrirLink = () => {
    if (!catalogoUrl) {
      toast.info("Nenhum link de catálogo configurado no momento.");
      return;
    }
    const destino = formatUrl(catalogoUrl);
    window.open(destino, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando catálogo...</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAbrirLink}
      className="inline-flex items-center gap-2 rounded-lg border border-primary-600 bg-primary-600 px-3.5 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 active:scale-[0.98]"
      title={
        catalogoUrl
          ? `Abrir catálogo: ${catalogoUrl}`
          : "Nenhum link de catálogo configurado"
      }
    >
      <span>Link do catálogo</span>
      <ExternalLink className="h-4 w-4" />
    </button>
  );
}
