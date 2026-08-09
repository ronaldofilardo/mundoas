"use client";

import { Fragment, useState } from "react";
import { toast } from "sonner";
import { formatCpf } from "../../../usuarios/comerciais/utils";
import { NovoComercialForm } from "../../../usuarios/comerciais/components/novo-comercial-form";
import { ComercialModal } from "../../../usuarios/comerciais/components/comercial-modal";
import type { Comercial } from "../../../usuarios/comerciais/types";
import type { EquipeItem } from "../types";

interface TabEquipeProps {
  itens: EquipeItem[];
  refetch: () => Promise<void>;
}

export function TabEquipe({ itens, refetch }: TabEquipeProps) {
  const [showModal, setShowModal] = useState(false);
  const [comercialEditando, setComercialEditando] = useState<Comercial | null>(null);
  const [editandoKind, setEditandoKind] = useState<"comercial" | "lideranca">("comercial");
  const [liderancaExpandida, setLiderancaExpandida] = useState<string | null>(null);

  async function handleDeletarComercial(comercialId: string) {
    const item = itens.find((i) => i.id === comercialId);
    if (!item || item.kind !== "comercial") return;

    if (!confirm(`Tem certeza que deseja deletar "${item.nome}"?`)) return;

    try {
      const res = await fetch(`/api/v1/backoffice/comerciais/${comercialId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao deletar");
        return;
      }
      toast.success("Comercial deletado");
      await refetch();
    } catch {
      toast.error("Erro ao deletar");
    }
  }

  function handleEditarComercial(item: EquipeItem) {
    if (item.kind !== "comercial") return;
    const lideranca = item.tipoLideranca
      ? (item.tipoLideranca as "GESTOR" | "COMERCIAL")
      : undefined;
    setComercialEditando({
      id: item.id,
      nome: item.nome,
      cpf: item.cpf,
      email: item.email,
      telefone: "",
      funcao: item.funcao ?? undefined,
      lideranca,
      tipoLideranca: lideranca,
      tipo: undefined,
      status: item.status,
      percentualComissao: item.percentualComissao ?? 0,
    });
    setEditandoKind("comercial");
    setShowModal(true);
  }

  function handleEditarLideranca(item: EquipeItem) {
    if (item.kind !== "lideranca") return;
    const lideranca = item.tipoLideranca
      ? (item.tipoLideranca as "GESTOR" | "COMERCIAL")
      : undefined;
    setComercialEditando({
      id: item.id,
      nome: item.nome,
      cpf: item.cpf,
      email: item.email,
      telefone: "",
      funcao: item.funcao ?? undefined,
      lideranca,
      tipoLideranca: lideranca,
      tipo: undefined,
      status: item.status,
      percentualComissao: item.percentualComissao ?? 0,
    });
    setEditandoKind("lideranca");
    setShowModal(true);
  }

  async function handleDeletarLideranca(id: string) {
    const item = itens.find((i) => i.id === id);
    if (!item || item.kind !== "lideranca") return;

    if (!confirm(`Tem certeza que deseja deletar "${item.nome}"?`)) return;

    try {
      const res = await fetch(`/api/v1/backoffice/liderancas/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao deletar liderança");
        return;
      }
      toast.success("Liderança desativada");
      await refetch();
    } catch {
      toast.error("Erro ao deletar liderança");
    }
  }

  async function handleSalvarEdicao(formData: Comercial) {
    const endpoint =
      editandoKind === "lideranca"
        ? `/api/v1/backoffice/liderancas/${formData.id}`
        : `/api/v1/backoffice/comerciais/${formData.id}`;
    const method = editandoKind === "lideranca" ? "PUT" : "PATCH";
    const payload: Record<string, unknown> = {
      nome: formData.nome,
      email: formData.email.toLowerCase().trim(),
      cpf: formData.cpf,
      telefone: formData.telefone || undefined,
      funcao: formData.funcao || undefined,
      status: formData.status,
    };
    if (editandoKind === "lideranca") {
      payload.tipo = formData.lideranca || undefined;
    } else {
      payload.lideranca = formData.lideranca || undefined;
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao editar");
        return;
      }
      toast.success(
        editandoKind === "lideranca"
          ? "Liderança editada com sucesso"
          : "Comercial editado com sucesso",
      );
      setShowModal(false);
      setComercialEditando(null);
      await refetch();
    } catch {
      toast.error("Erro ao editar");
    }
  }

  async function handleToggleStatusLideranca(id: string, statusAtual: string) {
    const novoStatus = statusAtual === "ATIVO" ? "INATIVO" : "ATIVO";
    try {
      const res = await fetch(`/api/v1/backoffice/liderancas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao atualizar status");
        return;
      }
      toast.success("Status atualizado");
      await refetch();
    } catch {
      toast.error("Erro ao atualizar status");
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0">
        <NovoComercialForm onCreated={refetch} />
      </div>

      <div className="card mt-6 flex-grow overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Equipe Cadastrada
          </h2>
        </div>
        {itens.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum membro cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto min-w-[900px]">
              <thead>
                <tr className="border-b bg-gray-50 sticky top-0 z-10">
                  <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[240px]">Nome</th>
                  <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[140px]">CPF</th>
                  <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[220px]">Email</th>
                  <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[170px]">Função / Tipo</th>
                  <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[100px]">Status</th>
                  <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[160px]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <Fragment key={`${item.kind}-${item.id}`}>
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 border-t">
                        <div className="flex items-center gap-2">
                          {item.kind === "lideranca" &&
                            (item.consultorPfs?.length ?? 0) > 0 && (
                              <button
                                onClick={() =>
                                  setLiderancaExpandida(
                                    liderancaExpandida === item.id ? null : item.id,
                                  )
                                }
                                className="text-gray-500 hover:text-gray-800 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200"
                                aria-label={
                                  liderancaExpandida === item.id
                                    ? "Recolher consultores"
                                    : "Expandir consultores"
                                }
                              >
                                {liderancaExpandida === item.id ? "−" : "+"}
                              </button>
                            )}
                          <p className="font-medium text-gray-900 truncate">
                            {item.nome}
                          </p>
                        </div>
                      </td>
                      <td className="p-3 border-t">
                        <p className="text-xs text-gray-600">{formatCpf(item.cpf)}</p>
                      </td>
                      <td className="p-3 border-t">
                        <p className="text-xs text-gray-600 truncate">{item.email}</p>
                      </td>
                      <td className="p-3 border-t">
                         {item.kind === "comercial" ? (
                           <div>
                             <p className="text-xs text-gray-800 font-medium">
                               {item.funcao ? item.funcao.replace(/_/g, " ") : "-"}
                             </p>
                             {item.tipoLideranca && (
                               <p className="text-xs text-gray-500">
                                 Liderança:{" "}
                                 {item.tipoLideranca === "COMERCIAL"
                                   ? "Comercial"
                                   : "Gestor"}
                               </p>
                             )}
                           </div>
                         ) : (
                           <div>
                             <p className="text-xs text-gray-800 font-medium">
                               Liderança:{" "}
                               {item.tipoLideranca === "COMERCIAL" ? "Comercial" : "Gestor"}
                             </p>
                             {(item.consultorPfs?.length ?? 0) > 0 && (
                               <p className="text-xs text-gray-500">
                                 {item.consultorPfs!.length} consultor
                                 {item.consultorPfs!.length === 1 ? "" : "es"} PF
                               </p>
                             )}
                             {(item.comerciais?.length ?? 0) > 0 && (
                               <p className="text-xs text-gray-500">
                                 {item.comerciais!.length} comercial
                                 {item.comerciais!.length === 1 ? "" : "is"}
                               </p>
                             )}
                           </div>
                         )}
                      </td>
                      <td className="p-3 border-t text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            item.status === "ATIVO"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 border-t">
                        <div className="flex gap-1 justify-center">
                          {item.kind === "comercial" && (
                            <Fragment>
                              <button
                                onClick={() => handleEditarComercial(item)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium px-1.5 py-1 rounded hover:bg-blue-50"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeletarComercial(item.id)}
                                className="text-red-600 hover:text-red-800 text-xs font-medium px-1.5 py-1 rounded hover:bg-red-50"
                              >
                                Deletar
                              </button>
                            </Fragment>
                          )}
                          {item.kind === "lideranca" && (
                            <Fragment>
                              <button
                                onClick={() => handleEditarLideranca(item)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium px-1.5 py-1 rounded hover:bg-blue-50"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleStatusLideranca(item.id, item.status)
                                }
                                className="text-xs font-medium px-2 py-1 rounded hover:bg-gray-100"
                              >
                                {item.status === "ATIVO" ? "Desativar" : "Ativar"}
                              </button>
                              <button
                                onClick={() => handleDeletarLideranca(item.id)}
                                className="text-red-600 hover:text-red-800 text-xs font-medium px-1.5 py-1 rounded hover:bg-red-50"
                              >
                                Deletar
                              </button>
                            </Fragment>
                          )}
                        </div>
                      </td>
                    </tr>
                    {item.kind === "lideranca" &&
                      liderancaExpandida === item.id &&
                      ((item.consultorPfs?.length ?? 0) > 0 ||
                        (item.comerciais?.length ?? 0) > 0) && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="p-0 border-t">
                            <div className="pl-10 pr-3 py-3 space-y-4">
                              {item.comerciais && item.comerciais.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                                    Comerciais desta liderança
                                  </p>
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-gray-200">
                                        <th className="text-left p-2 font-medium text-gray-500">
                                          Nome
                                        </th>
                                        <th className="text-left p-2 font-medium text-gray-500">
                                          CPF
                                        </th>
                                        <th className="text-left p-2 font-medium text-gray-500">
                                          Email
                                        </th>
                                        <th className="text-left p-2 font-medium text-gray-500">
                                          Função
                                        </th>
                                        <th className="text-center p-2 font-medium text-gray-500">
                                          Status
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.comerciais.map((c) => (
                                        <tr
                                          key={c.id}
                                          className="border-b border-gray-100 last:border-b-0 hover:bg-white"
                                        >
                                          <td className="p-2 font-medium text-gray-800">
                                            {c.nome}
                                          </td>
                                          <td className="p-2 text-gray-600">
                                            {formatCpf(c.cpf)}
                                          </td>
                                          <td className="p-2 text-gray-600 truncate">
                                            {c.email}
                                          </td>
                                          <td className="p-2 text-gray-600">
                                            {c.funcao ? c.funcao.replace(/_/g, " ") : "-"}
                                          </td>
                                          <td className="p-2 text-center">
                                            <span
                                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                c.status === "ATIVO"
                                                  ? "bg-green-100 text-green-800"
                                                  : "bg-red-100 text-red-800"
                                              }`}
                                            >
                                              {c.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              {item.consultorPfs && item.consultorPfs.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                                    Consultores PF desta liderança
                                  </p>
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-gray-200">
                                        <th className="text-left p-2 font-medium text-gray-500">
                                          Nome
                                        </th>
                                        <th className="text-left p-2 font-medium text-gray-500">
                                          CPF
                                        </th>
                                        <th className="text-left p-2 font-medium text-gray-500">
                                          Email
                                        </th>
                                        <th className="text-center p-2 font-medium text-gray-500">
                                          Status
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.consultorPfs.map((cp) => (
                                        <tr
                                          key={cp.id}
                                          className="border-b border-gray-100 last:border-b-0 hover:bg-white"
                                        >
                                          <td className="p-2 font-medium text-gray-800">
                                            {cp.nome}
                                          </td>
                                          <td className="p-2 text-gray-600">
                                            {formatCpf(cp.cpf)}
                                          </td>
                                          <td className="p-2 text-gray-600 truncate">
                                            {cp.email}
                                          </td>
                                          <td className="p-2 text-center">
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
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && comercialEditando && (
        <ComercialModal
          comercial={comercialEditando}
          onSave={handleSalvarEdicao}
          onClose={() => {
            setShowModal(false);
            setComercialEditando(null);
          }}
        />
      )}
    </div>
  );
}
