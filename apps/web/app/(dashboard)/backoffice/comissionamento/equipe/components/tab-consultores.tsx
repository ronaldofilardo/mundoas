"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatCpf } from "../../../usuarios/comerciais/utils";
import type { EquipeItem } from "../types";
import { ConsultorPfForm } from "./consultor-pf-form";

interface TabConsultoresProps {
  itens: EquipeItem[];
}

interface ConsultorCompleto {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string | null;
  status: string;
  liderancaNome: string;
  liderancaId: string;
  setores: Array<{ id: string; nome: string }>;
}

export function TabConsultores({ itens }: TabConsultoresProps) {
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ATIVO" | "INATIVO">("todos");
  const [filtroLideranca, setFiltroLideranca] = useState<string>("todas");
  const [busca, setBusca] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [consultorEditando, setConsultorEditando] = useState<ConsultorCompleto | null>(null);

  const liderancas = useMemo(
    () => itens.filter((i) => i.kind === "lideranca" && i.status === "ATIVO"),
    [itens],
  );

  const todosConsultores = useMemo((): ConsultorCompleto[] => {
    const consultores: ConsultorCompleto[] = [];

    itens
      .filter((i) => i.kind === "lideranca")
      .forEach((lideranca) => {
        (lideranca.consultorPfs ?? []).forEach((cp) => {
          consultores.push({
            id: cp.id,
            nome: cp.nome,
            cpf: cp.cpf,
            email: cp.email,
            telefone: cp.telefone ?? null,
            status: cp.status,
            liderancaNome: lideranca.nome,
            liderancaId: lideranca.id,
            setores: cp.setores ?? [],
          });
        });
      });

    return consultores;
  }, [itens]);

  const consultoresFiltrados = useMemo(() => {
    return todosConsultores.filter((cp) => {
      if (filtroStatus !== "todos" && cp.status !== filtroStatus) return false;
      if (filtroLideranca !== "todas" && cp.liderancaId !== filtroLideranca) return false;
      if (busca && !cp.nome.toLowerCase().includes(busca.toLowerCase()) &&
          !cp.cpf.includes(busca.replace(/\D/g, "")) &&
          !cp.email.toLowerCase().includes(busca.toLowerCase()) &&
          !cp.liderancaNome.toLowerCase().includes(busca.toLowerCase()) &&
          !cp.setores.some((s) => s.nome.toLowerCase().includes(busca.toLowerCase()))) {
        return false;
      }
      return true;
    });
  }, [todosConsultores, filtroStatus, filtroLideranca, busca ]);

  const totalAtivos = todosConsultores.filter((c) => c.status === "ATIVO").length;
  const totalInativos = todosConsultores.filter((c) => c.status === "INATIVO").length;

  async function handleCriarConsultor(data: {
    nome: string;
    cpf: string;
    liderancaId: string;
    setores: string[];
  }) {
    const res = await fetch("/api/v1/backoffice/consultores-pf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao criar consultor");
    }
  }

  async function handleAtualizarConsultor(id: string, data: {
    nome: string;
    cpf: string;
    liderancaId: string;
    setores: string[];
  }) {
    const res = await fetch(`/api/v1/backoffice/consultores-pf/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao atualizar consultor");
    }
  }

  async function handleDeletarConsultor(id: string) {
    if (!confirm("Tem certeza que deseja remover este consultor?")) return;

    const res = await fetch(`/api/v1/backoffice/consultores-pf/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao remover consultor");
    }
  }

  function handleSalvar(data: {
    nome: string;
    cpf: string;
    liderancaId: string;
    setores: string[];
  }): Promise<void> {
    if (consultorEditando) {
      return handleAtualizarConsultor(consultorEditando.id, data);
    } else {
      return handleCriarConsultor(data);
    }
  }

  function handleEditar(cp: ConsultorCompleto) {
    setConsultorEditando(cp);
    setShowModal(true);
  }

  function handleNovo() {
    setConsultorEditando(null);
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setConsultorEditando(null);
  }

  if (todosConsultores.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500">Nenhum consultor PF cadastrado.</p>
        <p className="text-xs text-gray-400 mt-1">
          Os consultores são vinculados às lideranças na aba "Equipe".
        </p>
      </div>
    );
  }

  function renderSetores(setores: Array<{ id: string; nome: string }>) {
    if (!setores || setores.length === 0) {
      return <span className="text-xs text-gray-400">—</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {setores.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
            title={s.nome}
          >
            {s.nome}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Buscar consultor, CPF, email, liderança ou setor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full px-3 py-2 border rounded pl-9 focus:ring-2 focus:ring-primary-500 text-sm"
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <label htmlFor="filtro-status-consultores" className="text-sm font-medium text-gray-700">
          Status:
        </label>
        <select
          id="filtro-status-consultores"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as "todos" | "ATIVO" | "INATIVO")}
          className="px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500 text-sm"
        >
          <option value="todos">Todos</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
        </select>

        <label htmlFor="filtro-lideranca-consultores" className="text-sm font-medium text-gray-700">
          Liderança:
        </label>
        <select
          id="filtro-lideranca-consultores"
          value={filtroLideranca}
          onChange={(e) => setFiltroLideranca(e.target.value)}
          className="px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500 text-sm"
        >
          <option value="todas">Todas</option>
          {liderancas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>

        <div className="ml-auto flex gap-3 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Ativos: {totalAtivos}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Inativos: {totalInativos}
          </span>
          <span className="font-medium">Total: {todosConsultores.length}</span>
        </div>

        <button
          onClick={handleNovo}
          className="ml-auto px-3 py-2 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + Novo Consultor
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto min-w-[900px]">
            <thead>
              <tr className="border-b bg-gray-50 sticky top-0 z-10">
                <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[200px]">Liderança</th>
                <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[220px]">Consultor</th>
                <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">Setor(es)</th>
                <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[100px]">Status</th>
                <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[140px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {consultoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Nenhum consultor encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                consultoresFiltrados.map((cp) => (
                  <tr key={cp.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <p className="font-medium text-gray-900 truncate">{cp.liderancaNome}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-gray-900 truncate">{cp.nome}</p>
                      <p className="text-xs text-gray-500 font-mono">{formatCpf(cp.cpf)}</p>
                      <p className="text-xs text-gray-500 truncate">{cp.email}</p>
                    </td>
                    <td className="p-3">
                      {renderSetores(cp.setores)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          cp.status === "ATIVO"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cp.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleEditar(cp)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50"
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeletarConsultor(cp.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                          title="Excluir"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ConsultorPfForm
          consultor={consultorEditando}
          onSave={handleSalvar}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}