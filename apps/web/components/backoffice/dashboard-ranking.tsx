"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  Medal,
  Award,
  Coins,
  Sparkles,
  ChevronRight,
  TrendingUp,
  UserCheck,
} from "lucide-react";

interface CicloPontos {
  id: string;
  nome: string;
  status: string;
  publico?: string;
}

interface RankingItem {
  posicao: number;
  consultor?: { id: string; nome: string; cpf: string; email?: string | null };
  parceiro?: { id: string; nome: string; cpf: string; email?: string | null };
  pontosAcumulados: number;
  totalProducao: number;
  valorPontos?: number;
}

interface RankingData {
  ciclo: CicloPontos;
  posicoes: RankingItem[];
}

interface RankingResponse {
  ranking: RankingData;
}

interface CiclosResponse {
  ciclos: CicloPontos[];
}

function formatarBRL(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function getInitials(nome: string): string {
  if (!nome) return "C";
  const partes = nome.trim().split(" ");
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function DashboardRankingSection() {
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [ciclos, setCiclos] = useState<CicloPontos[]>([]);
  const [cicloId, setCicloId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publicoTab, setPublicoTab] = useState<"CONSULTOR_PF" | "PARCEIRO">("CONSULTOR_PF");

  useEffect(() => {
    fetchCiclos(publicoTab);
  }, [publicoTab]);

  useEffect(() => {
    fetchRanking(cicloId, publicoTab);
  }, [cicloId, publicoTab]);

  const fetchCiclos = async (pub: "CONSULTOR_PF" | "PARCEIRO") => {
    try {
      const endpoint =
        pub === "CONSULTOR_PF"
          ? "/api/v1/backoffice/pontos/bonus/ciclos"
          : "/api/v1/backoffice/pontos/ciclos";
      const res = await fetch(endpoint);
      if (!res.ok) return;
      const data = (await res.json()) as CiclosResponse;
      if (data.ciclos && Array.isArray(data.ciclos)) {
        setCiclos(data.ciclos);
        const ativo = data.ciclos.find(
          (c) => c.status === "EM_ANDAMENTO" || c.status === "RESGATE_ABERTO",
        );
        setCicloId(ativo ? ativo.id : data.ciclos[0]?.id || null);
      }
    } catch (err) {
      console.error("Erro ao carregar ciclos de ranking:", err);
    }
  };

  const fetchRanking = async (cId: string | null, pub: "CONSULTOR_PF" | "PARCEIRO") => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(
        "/api/v1/backoffice/pontos/ranking",
        window.location.origin,
      );
      if (cId) url.searchParams.append("cicloPontosId", cId);
      url.searchParams.append("publico", pub);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Não foi possível carregar o ranking");
      const data = (await res.json()) as RankingResponse;
      setRanking(data.ranking);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar ranking");
    } finally {
      setLoading(false);
    }
  };

  const topThree = ranking?.posicoes ? ranking.posicoes.slice(0, 3) : [];
  const restantes = ranking?.posicoes ? ranking.posicoes.slice(3) : [];

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-sm space-y-6">
      {/* Structural Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Trophy className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Ranking dos Ciclos Vigentes
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Desempenho dos consultores e parceiros por bônus e pontuação acumulada.
          </p>
        </div>

        {/* Tab & Cycle Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Public Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100/80 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setPublicoTab("CONSULTOR_PF")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                publicoTab === "CONSULTOR_PF"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Consultores PF
            </button>
            <button
              type="button"
              onClick={() => setPublicoTab("PARCEIRO")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                publicoTab === "PARCEIRO"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Parceiros
            </button>
          </div>

          {/* Ciclo Select */}
          {ciclos.length > 0 && (
            <select
              value={cicloId || ""}
              onChange={(e) => setCicloId(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {ciclos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.status})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-400">
            Atualizando ranking do ciclo...
          </p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-center text-xs text-red-600 font-medium">
          {error}
        </div>
      ) : !ranking || ranking.posicoes.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm space-y-1">
          <p className="font-semibold text-slate-600">Nenhum dado de ranking registrado</p>
          <p className="text-xs">
            As posições aparecerão assim que houver produção/pontuação no ciclo.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 3 Podium Highlights */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {topThree.map((item) => {
                const info = item.consultor || item.parceiro;
                const isFirst = item.posicao === 1;
                const isSecond = item.posicao === 2;
                const isThird = item.posicao === 3;

                const cardBg = isFirst
                  ? "bg-gradient-to-b from-amber-50/90 to-amber-100/40 border-amber-200/80 shadow-amber-50"
                  : isSecond
                    ? "bg-gradient-to-b from-slate-50 to-slate-100/50 border-slate-200"
                    : "bg-gradient-to-b from-amber-700/5 to-orange-100/30 border-orange-200/70";

                const badgeBg = isFirst
                  ? "bg-amber-400 text-amber-950"
                  : isSecond
                    ? "bg-slate-300 text-slate-800"
                    : "bg-orange-300 text-orange-950";

                return (
                  <div
                    key={item.posicao}
                    className={`relative p-5 rounded-2xl border shadow-sm transition-all hover:-translate-y-0.5 flex flex-col justify-between ${cardBg}`}
                  >
                    {/* Position Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${badgeBg}`}
                      >
                        #{item.posicao}
                      </span>
                      {isFirst ? (
                        <Trophy className="w-5 h-5 text-amber-500 animate-pulse" />
                      ) : isSecond ? (
                        <Medal className="w-5 h-5 text-slate-400" />
                      ) : (
                        <Award className="w-5 h-5 text-orange-500" />
                      )}
                    </div>

                    {/* Consultor Info */}
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                          {getInitials(info?.nome || "")}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {info?.nome || "Consultor"}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            CPF: {info?.cpf || "---"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Score Badges */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200/60">
                      <div className="bg-white/80 p-2 rounded-xl border border-slate-200/50">
                        <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                          Bônus / Produção
                        </span>
                        <span className="text-xs font-bold text-emerald-600 tabular-nums">
                          {formatarBRL(item.totalProducao)}
                        </span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-xl border border-slate-200/50">
                        <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                          Pontos
                        </span>
                        <span className="text-xs font-bold text-amber-600 tabular-nums flex items-center gap-1">
                          <Coins className="w-3 h-3 text-amber-500" />
                          {item.pontosAcumulados}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest of Ranking List */}
          {restantes.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Demais Posições
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-200/60 rounded-2xl overflow-hidden bg-white">
                {restantes.map((item) => {
                  const info = item.consultor || item.parceiro;
                  return (
                    <div
                      key={item.posicao}
                      className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center font-mono">
                          #{item.posicao}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {info?.nome || "Consultor"}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {info?.cpf || "---"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <p className="text-xs font-semibold text-emerald-600 tabular-nums">
                            {formatarBRL(item.totalProducao)}
                          </p>
                          <p className="text-[10px] text-slate-400">produção</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-amber-600 tabular-nums">
                            {item.pontosAcumulados} pts
                          </p>
                          <p className="text-[10px] text-slate-400">acumulados</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
