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
import { UploadPlanilhaConsultoresPf } from "./_components/upload-planilha-consultores-pf";

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
  const [editando, setEditando] = useState<ConsultorPf | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editSetores, setEditSetores] = useState<string[]>([]);
  const [setoresOpcoes, setSetoresOpcoes] = useState<string[]>([]);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [alternandoId, setAlternandoId] = useState<string | null>(null);

  useEffect(() => {
    fetchConsultores();
    fetchSetores();
  }, []);

  async function fetchSetores() {
    try {
      const res = await fetch("/api/v1/setores?origem=regras-consultores");
      if (!res.ok) throw new Error("Erro ao carregar setores da regra");
      const data: Array<{ id: string; nome: string }> = await res.json();
      setSetoresOpcoes(data.map((s) => s.nome));
    } catch {
      setSetoresOpcoes([]);
      toast.error("Não foi possível carregar os setores de Regras: Consultores");
    }
  }

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

  function abrirEdicao(c: ConsultorPf) {
    setEditando(c);
    setEditNome(c.nome);
    setEditEmail(c.email);
    setEditCpf(formatarCpf(c.cpf));
    setEditTelefone(c.telefone || "");
    setEditSetores(c.setores?.map((s) => s.nome) ?? []);
  }

  function toggleEditSetor(nome: string) {
    setEditSetores((prev) =>
      prev.includes(nome) ? prev.filter((s) => s !== nome) : [...prev, nome],
    );
  }

  async function handleSalvarEdicao() {
    if (!editando) return;
    if (editNome.trim().length < 3) {
      toast.error("Nome deve ter no mínimo 3 caracteres");
      return;
    }
    if (!editEmail.trim()) {
      toast.error("Informe um email válido");
      return;
    }
    if (editCpf.replace(/\D/g, "").length !== 11) {
      toast.error("CPF deve ter 11 dígitos");
      return;
    }
    if (editSetores.length === 0) {
      toast.error("Selecione ao menos um setor");
      return;
    }
    setSalvandoEdicao(true);
    try {
      const res = await fetch(`/api/v1/lideranca/consultores-pf/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: editNome.trim(),
          email: editEmail.trim(),
          cpf: editCpf.replace(/\D/g, ""),
          telefone: editTelefone.trim(),
          setores: editSetores,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Erro ao salvar");
      }
      toast.success("Consultor atualizado");
      setEditando(null);
      await fetchConsultores();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar consultor");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function handleAlternarStatus(c: ConsultorPf) {
    const novoStatus = c.status === "ATIVO" ? "INATIVO" : "ATIVO";
    setAlternandoId(c.id);
    try {
      const res = await fetch(`/api/v1/lideranca/consultores-pf/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!res.ok) throw new Error("Erro ao alterar status");
      toast.success(novoStatus === "ATIVO" ? "Consultor ativado" : "Consultor desativado");
      await fetchConsultores();
    } catch {
      toast.error("Erro ao alterar status do consultor");
    } finally {
      setAlternandoId(null);
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
        <div className="flex gap-2">
          <UploadPlanilhaConsultoresPf />
          <Link
            href="/lideranca/consultores-pf/novo"
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Novo Consultor PF
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium text-gray-600">Nome</th>
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
                  <td className="p-2 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>{c.nome}</span>
                      <button
                        type="button"
                        onClick={() => abrirEdicao(c)}
                        className="px-2 py-0.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
                        title="Editar consultor"
                        aria-label={`Editar ${c.nome}`}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAlternarStatus(c)}
                        disabled={alternandoId === c.id}
                        className={`px-2 py-0.5 text-xs rounded border disabled:opacity-50 ${
                          c.status === "ATIVO"
                            ? "border-red-300 text-red-600 hover:bg-red-50"
                            : "border-green-300 text-green-600 hover:bg-green-50"
                        }`}
                        title={c.status === "ATIVO" ? "Desativar consultor" : "Ativar consultor"}
                        aria-label={`${c.status === "ATIVO" ? "Desativar" : "Ativar"} ${c.nome}`}
                      >
                        {alternandoId === c.id
                          ? "..."
                          : c.status === "ATIVO"
                            ? "Desativar"
                            : "Ativar"}
                      </button>
                    </div>
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
                  <td colSpan={4 + MESES_ANO.length} className="p-8 text-center text-gray-500">
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

      {editando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => !salvandoEdicao && setEditando(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900">Editar consultor</h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="edit-nome" className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  id="edit-nome"
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label htmlFor="edit-cpf" className="block text-sm font-medium text-gray-700">
                  CPF
                </label>
                <input
                  id="edit-cpf"
                  type="text"
                  value={editCpf}
                  onChange={(e) => setEditCpf(e.target.value)}
                  maxLength={14}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label htmlFor="edit-telefone" className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <input
                  id="edit-telefone"
                  type="text"
                  value={editTelefone}
                  onChange={(e) => setEditTelefone(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700">
                  Setores
                </span>
                <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Array.from(new Set([...setoresOpcoes, ...editSetores])).map((nome) => {
                    const checked = editSetores.includes(nome);
                    return (
                      <label
                        key={nome}
                        className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                          checked
                            ? "border-green-600 bg-green-50 text-green-800"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEditSetor(nome)}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span>{nome}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditando(null)}
                disabled={salvandoEdicao}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarEdicao}
                disabled={salvandoEdicao}
                className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {salvandoEdicao ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
