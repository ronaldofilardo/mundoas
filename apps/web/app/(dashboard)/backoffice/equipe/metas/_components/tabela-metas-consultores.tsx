/**
 * Tabela READ-ONLY de metas mensais por Consultor PF para o painel
 * /backoffice/equipe/metas (aba "Consultor").
 *
 * Apenas EXIBE as metas que cada liderança cadastrou em
 * /lideranca/equipe/consultores-pf. A escrita é de responsabilidade
 * do líder (vide /api/v1/lideranca/consultores-pf/[id]/metas).
 */
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

const MESES_ANO = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Fev" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Abr" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Ago" },
  { value: "09", label: "Set" },
  { value: "10", label: "Out" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dez" },
] as const;

type MesValue = (typeof MESES_ANO)[number]["value"];

interface ConsultorPf {
  id: string;
  nome: string;
  cpf: string;
  status: string;
  createdAt: string;
  setores?: Array<{ id: string; nome: string }>;
  lideranca?: { id: string; nome: string };
}

interface MetaConsultorPf {
  id: string;
  consultorPfId: string;
  mesReferencia: string;
  valorMeta: string | number;
}

function composeMesReferencia(ano: number, mes: MesValue): string {
  return `${ano}-${mes}`;
}

function formatarData(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function TabelaMetasConsultores() {
  const [consultores, setConsultores] = useState<ConsultorPf[]>([]);
  const [loading, setLoading] = useState(true);
  const [metasPorConsultor, setMetasPorConsultor] = useState<Record<string, MetaConsultorPf[]>>({});
  const [loadingMetas, setLoadingMetas] = useState(false);
  const [anoReferencia] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchConsultores();
  }, []);

  useEffect(() => {
    if (consultores.length > 0) {
      fetchMetasGerais();
    }
  }, [consultores]);

  async function fetchConsultores() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/backoffice/consultores-pf");
      if (!res.ok) throw new Error("Erro ao carregar consultores");
      const data: ConsultorPf[] = await res.json();
      setConsultores(data);
    } catch {
      toast.error("Erro ao carregar consultores PF");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMetasGerais() {
    setLoadingMetas(true);
    try {
      const promises = consultores.map(async (c) => {
        const res = await fetch(`/api/v1/backoffice/consultores-pf/${c.id}/metas`);
        const data = res.ok ? await res.json() : { metas: [] };
        const metas: MetaConsultorPf[] = Array.isArray(data?.metas) ? data.metas : [];
        return { consultorId: c.id, metas };
      });
      const results = await Promise.all(promises);
      const map: Record<string, MetaConsultorPf[]> = {};
      results.forEach((r) => {
        map[r.consultorId] = r.metas;
      });
      setMetasPorConsultor(map);
    } catch {
      toast.error("Erro ao carregar metas");
    } finally {
      setLoadingMetas(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Metas dos Consultores PF ({anoReferencia})
          </h2>
          <p className="text-sm text-gray-500">
            Visualização das metas mensais cadastradas por cada liderança.
            Edição disponível em Liderança → Equipe → Consultores PF.
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium text-gray-600">Nome</th>
                <th className="text-left p-2 font-medium text-gray-600">Liderança</th>
                <th className="text-left p-2 font-medium text-gray-600">Setor</th>
                <th className="text-left p-2 font-medium text-gray-600">Status</th>
                <th className="text-left p-2 font-medium text-gray-600">Criado em</th>
                {MESES_ANO.map((m) => (
                  <th
                    key={m.value}
                    className="text-center p-2 font-medium text-gray-600 min-w-[72px]"
                  >
                    {m.label}/{anoReferencia}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {consultores.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium text-gray-900">{c.nome}</td>
                  <td className="p-2 text-gray-700">
                    {c.lideranca?.nome ?? <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {c.setores && c.setores.length > 0 ? (
                        c.setores.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                            title={s.nome}
                          >
                            {s.nome}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        c.status === "ATIVO"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {c.status === "ATIVO" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-2 text-gray-600">{formatarData(c.createdAt)}</td>
                  {MESES_ANO.map((m) => {
                    const mesRef = composeMesReferencia(anoReferencia, m.value);
                    const meta = metasPorConsultor[c.id]?.find(
                      (mt) => mt.mesReferencia === mesRef,
                    );
                    const valor = meta ? Number(meta.valorMeta) : 0;
                    return (
                      <td
                        key={m.value}
                        className="p-1 text-center text-gray-700"
                        aria-label={`Meta de ${c.nome} para ${m.label}/${anoReferencia}`}
                      >
                        {valor > 0 ? (
                          <span className="font-medium">{formatarMoeda(valor)}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {consultores.length === 0 && (
                <tr>
                  <td colSpan={5 + MESES_ANO.length} className="p-8 text-center text-gray-500">
                    Nenhum consultor PF cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {loadingMetas && consultores.length > 0 && (
          <p className="text-xs text-gray-400 p-2">Carregando metas...</p>
        )}
      </div>
    </div>
  );
}
