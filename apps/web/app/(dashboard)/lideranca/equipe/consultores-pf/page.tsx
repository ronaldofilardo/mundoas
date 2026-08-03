"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  MESES_ANO,
  composeMesReferencia,
  formatarCpf,
  formatarData,
  normalizarRespostaMetas,
  salvarMeta,
  validarValorMeta,
} from "./utils";

interface ConsultorPf {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string | null;
  status: string;
  createdAt: string;
  setores?: Array<{ id: string; nome: string }>;
}

interface MetaConsultorPf {
  id: string;
  consultorPfId: string;
  mesReferencia: string;
  valorMeta: string | number;
}

export default function ConsultoresPfPage() {
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
      const res = await fetch("/api/v1/lideranca/consultores-pf");
      if (!res.ok) throw new Error("Erro ao carregar consultores");
      const data = await res.json();
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
        const res = await fetch(`/api/v1/lideranca/consultores-pf/${c.id}/metas`);
        const data = res.ok ? await res.json() : { metas: [] };
        return { consultorId: c.id, metas: normalizarRespostaMetas(data) };
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

  async function handleSalvarMeta(consultorId: string, mesRef: string, rawValor: string) {
    const validacao = validarValorMeta(rawValor);
    if (!validacao.ok) {
      if (validacao.motivo === "vazio") return;
      toast.error("Valor inválido");
      return;
    }
    const resultado = await salvarMeta(fetch, consultorId, {
      mesReferencia: mesRef,
      valorMeta: validacao.valor,
    });
    if (resultado.ok) {
      toast.success("Meta salva");
    } else {
      toast.error(resultado.mensagem);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="font-sans space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/lideranca/equipe" className="text-gray-600 hover:text-gray-900">
              ←
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Consultores PF</h1>
          </div>
          <p className="text-sm text-gray-500">
            Gerencie seus {consultores.length} consultores PF
          </p>
        </div>
        <Link
          href="/lideranca/consultores-pf/novo"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          Novo Consultor PF
        </Link>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium text-gray-600">Nome</th>
                <th className="text-left p-2 font-medium text-gray-600">Email</th>
                <th className="text-left p-2 font-medium text-gray-600">CPF</th>
                <th className="text-left p-2 font-medium text-gray-600">Telefone</th>
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
                  <td className="p-2 text-gray-600">{c.email}</td>
                  <td className="p-2 text-gray-600">{formatarCpf(c.cpf)}</td>
                  <td className="p-2 text-gray-600">{c.telefone || "-"}</td>
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
                    return (
                      <td key={m.value} className="p-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={meta ? Number(meta.valorMeta) : ""}
                          placeholder="R$"
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          aria-label={`Meta de ${c.nome} para ${m.label}/${anoReferencia}`}
                          onBlur={(e) => {
                            if (e.target.value !== "") {
                              handleSalvarMeta(c.id, mesRef, e.target.value);
                            }
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}

              {consultores.length === 0 && (
                <tr>
                  <td colSpan={7 + MESES_ANO.length} className="p-8 text-center text-gray-500">
                    Nenhum consultor PF na equipe
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
