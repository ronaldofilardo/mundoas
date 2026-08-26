"use client";

import { useEffect, useState } from "react";

type Premio = { id: string; nome?: string; codigo?: string; descricao: string; custoPontos: number; imagemUrl?: string | null };
type Carteira = { ciclo: { id: string; nome: string; status: string } | null; saldo: number; movimentacoes: Array<{ id: string; tipo: string; origem: string; quantidade: number; descricao?: string | null; criadoEm: string }> };

export default function BonusConsultorPfPage() {
  const [carteira, setCarteira] = useState<Carteira | null>(null);
  const [premios, setPremios] = useState<Premio[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    const [carteiraResponse, premiosResponse] = await Promise.all([
      fetch("/api/v1/consultor/bonus/carteira"),
      fetch("/api/v1/consultor/bonus/premios"),
    ]);
    if (carteiraResponse.ok) setCarteira(await carteiraResponse.json());
    if (premiosResponse.ok) setPremios((await premiosResponse.json()).premios ?? []);
    setCarregando(false);
  }

  useEffect(() => { void carregar(); }, []);

  async function resgatar(premioId: string) {
    setMensagem("");
    const response = await fetch("/api/v1/consultor/bonus/resgates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ premioId }) });
    const body = await response.json().catch(() => ({}));
    setMensagem(response.ok ? "Resgate solicitado com sucesso." : body.error ?? "Não foi possível solicitar o resgate.");
    if (response.ok) await carregar();
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando Bônus...</p>;
  return (
    <main className="space-y-6">
      <header><h1 className="text-2xl font-bold text-gray-900">Bônus</h1><p className="mt-1 text-sm text-gray-500">Acompanhe sua produção convertida em pontos e troque por prêmios.</p></header>
      <section className="rounded-xl border border-violet-200 bg-violet-50 p-5"><p className="text-sm text-violet-900">Ciclo atual</p><p className="text-lg font-semibold text-violet-950">{carteira?.ciclo?.nome ?? "Nenhum ciclo aberto"}</p><p className="mt-3 text-3xl font-bold text-violet-700">{carteira?.saldo ?? 0} <span className="text-base font-normal">pontos</span></p></section>
      {mensagem && <p className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{mensagem}</p>}
      <section><h2 className="mb-3 text-lg font-semibold text-gray-900">Catálogo de prêmios</h2><div className="grid gap-4 md:grid-cols-3">{premios.map((premio) => <article key={premio.id} className="rounded-xl border bg-white p-4 shadow-sm"><h3 className="font-semibold text-gray-900">{premio.nome ?? premio.codigo ?? "Prêmio"}</h3><p className="mt-2 min-h-12 text-sm text-gray-600">{premio.descricao}</p><p className="mt-3 font-bold text-violet-700">{premio.custoPontos} pontos</p><button className="mt-4 w-full rounded bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50" disabled={(carteira?.saldo ?? 0) < premio.custoPontos || carteira?.ciclo?.status !== "RESGATE_ABERTO"} onClick={() => void resgatar(premio.id)}>Trocar por prêmio</button></article>)}</div>{premios.length === 0 && <p className="text-sm text-gray-500">Nenhum prêmio disponível neste momento.</p>}</section>
      <section><h2 className="mb-3 text-lg font-semibold text-gray-900">Extrato de Bônus</h2><div className="overflow-x-auto rounded-xl border bg-white"><table className="min-w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Data</th><th className="p-3">Origem</th><th className="p-3">Descrição</th><th className="p-3 text-right">Pontos</th></tr></thead><tbody>{(carteira?.movimentacoes ?? []).map((mov) => <tr key={mov.id} className="border-b last:border-0"><td className="p-3">{new Date(mov.criadoEm).toLocaleDateString("pt-BR")}</td><td className="p-3">{mov.origem}</td><td className="p-3">{mov.descricao ?? "—"}</td><td className={`p-3 text-right font-semibold ${mov.tipo === "DEBITO" ? "text-red-600" : "text-green-600"}`}>{mov.tipo === "DEBITO" ? "-" : "+"}{mov.quantidade}</td></tr>)}</tbody></table></div></section>
    </main>
  );
}
