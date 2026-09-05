"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Premio = {
  id: string;
  nome?: string;
  codigo?: string;
  descricao: string;
  custoPontos: number;
  imagemUrl?: string | null;
};
type Carteira = {
  ciclo: { id: string; nome: string; status: string } | null;
  gestor: { id: string; nome: string } | null;
  saldo: number;
  totalResgates: number;
  ultimaProducao: string | null;
  movimentacoes: Array<{
    id: string;
    tipo: string;
    origem: string;
    quantidade: number;
    descricao?: string | null;
    criadoEm: string;
  }>;
};

export default function BonusConsultorPfPage() {
  const [carteira, setCarteira] = useState<Carteira | null>(null);
  const [premios, setPremios] = useState<Premio[]>([]);
  const [catalogoUrl, setCatalogoUrl] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    setMensagem("");
    try {
      const [carteiraResponse, premiosResponse] = await Promise.all([
        fetch("/api/v1/consultor/bonus/carteira"),
        fetch("/api/v1/consultor/bonus/premios"),
      ]);

      if (!carteiraResponse.ok) {
        const body = await carteiraResponse.json().catch(() => ({}));
        throw new Error(body.error ?? "Falha ao carregar bônus");
      }
      if (!premiosResponse.ok) {
        const body = await premiosResponse.json().catch(() => ({}));
        throw new Error(body.error ?? "Falha ao carregar prêmios");
      }

      const carteiraJson = await carteiraResponse.json();
      const premiosJson = await premiosResponse.json();
      setCarteira(carteiraJson);
      setPremios(premiosJson.premios ?? []);
      setCatalogoUrl(premiosJson.catalogoUrl ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao carregar bônus";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const [error, setError] = useState<string | null>(null);

  async function resgatar(premioId: string) {
    setMensagem("");
    const response = await fetch("/api/v1/consultor/bonus/resgates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ premioId }),
    });
    const body = await response.json().catch(() => ({}));
    setMensagem(
      response.ok
        ? "Resgate solicitado com sucesso."
        : body.error ?? "Não foi possível solicitar o resgate.",
    );
    if (response.ok) await carregar();
  }

  function formatarData(iso: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const saldo = carteira?.saldo ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonificação</h1>
        <p className="text-sm text-gray-500">
          Acompanhe sua bonificação em relação ao ciclo vigente
        </p>
      </div>

      {carteira?.ciclo && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Ciclo vigente</p>
          <p className="text-sm font-semibold text-gray-900">
            {carteira.ciclo.nome}{" "}
            <span className="text-xs text-gray-500">
              ({carteira.ciclo.status})
            </span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Pontos</p>
          <p className="text-lg font-semibold text-gray-900">
            {saldo.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Resgates</p>
          <p className="text-lg font-semibold text-gray-900">
            {carteira?.totalResgates ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Última produção</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatarData(carteira?.ultimaProducao ?? null)}
          </p>
        </div>
      </div>

      {carteira?.gestor && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Gestor</p>
          <p className="text-sm font-semibold text-gray-900">
            {carteira.gestor.nome}
          </p>
        </div>
      )}

      {mensagem && (
        <p className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          {mensagem}
        </p>
      )}

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="mb-1 text-lg font-semibold text-gray-900">
                Catálogo de prêmios
              </h2>
              <p className="text-xs text-gray-500">
                Consulte as opções disponíveis para resgate.
              </p>
            </div>
            {catalogoUrl && (
              <a
                href={catalogoUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
              >
                Abrir catálogo externo
              </a>
            )}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {premios.map((premio) => (
              <article
                key={premio.id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <h3 className="font-semibold text-gray-900">
                  {premio.nome ?? premio.codigo ?? "Prêmio"}
                </h3>
                <p className="mt-2 min-h-12 text-sm text-gray-600">
                  {premio.descricao}
                </p>
                <p className="mt-3 font-bold text-violet-700">
                  {premio.custoPontos} pontos
                </p>
                <button
                  className="mt-4 w-full rounded bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                  disabled={
                    saldo < premio.custoPontos ||
                    carteira?.ciclo?.status !== "RESGATE_ABERTO"
                  }
                  onClick={() => void resgatar(premio.id)}
                >
                  Trocar por prêmio
                </button>
              </article>
            ))}
          </div>
          {premios.length === 0 && (
            <p className="text-sm text-gray-500">
              Nenhum prêmio disponível neste momento.
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Extrato de Bônus
          </h2>
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3">Data</th>
                  <th className="p-3">Origem</th>
                  <th className="p-3">Descrição</th>
                  <th className="p-3 text-right">Pontos</th>
                </tr>
              </thead>
              <tbody>
                {(carteira?.movimentacoes ?? []).map((mov) => (
                  <tr key={mov.id} className="border-b last:border-0">
                    <td className="p-3">
                      {new Date(mov.criadoEm).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-3">{mov.origem}</td>
                    <td className="p-3">{mov.descricao ?? "—"}</td>
                    <td
                      className={`p-3 text-right font-semibold ${
                        mov.tipo === "DEBITO" ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {mov.tipo === "DEBITO" ? "-" : "+"}
                      {mov.quantidade}
                    </td>
                  </tr>
                ))}
                {(!carteira?.movimentacoes || carteira.movimentacoes.length === 0) && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-sm text-gray-500">
                      Nenhuma movimentação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
