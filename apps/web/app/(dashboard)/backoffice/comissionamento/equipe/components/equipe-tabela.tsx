"use client";

import { Fragment, useState } from "react";
import type { EquipeItem } from "../types";
import { toast } from "sonner";
import { LiderancaExpanded } from "./lideranca-expanded";
import { ModalResetSenha } from "./modal-reset-senha";
import { Copy, Check } from "lucide-react";

interface EquipeTabelaProps {
  itens: EquipeItem[];
  liderancaExpandida: string | null;
  setLiderancaExpandida: (id: string | null) => void;
  onEditar: (item: EquipeItem) => void;
  onDeletarComercial: (id: string) => void;
  onDeletarLideranca: (id: string) => void;
  onToggleStatusLideranca: (id: string, statusAtual: string) => void;
  onRefetch?: () => Promise<void>;
}

export function EquipeTabela({
  itens,
  liderancaExpandida,
  setLiderancaExpandida,
  onEditar,
  onDeletarComercial,
  onDeletarLideranca,
  onToggleStatusLideranca,
  onRefetch,
}: EquipeTabelaProps) {
  const [resetModalItem, setResetModalItem] = useState<EquipeItem | null>(null);
  const [linksCache, setLinksCache] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isPendingReset = (item: EquipeItem) =>
    Boolean(item.senhaTemporaria || linksCache[item.id]);

  async function handleConfirmReset(item: EquipeItem): Promise<string | null> {
    const res = await fetch(
      `/api/v1/backoffice/equipe/${item.id}/reset-senha`,
      { method: "POST" },
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Erro ao resetar senha.");
    }
    setLinksCache((prev) => ({ ...prev, [item.id]: data.link }));
    item.senhaTemporaria = true;
    if (onRefetch) {
      void onRefetch();
    }
    return data.link;
  }

  async function handleCopiarLinkDireto(item: EquipeItem) {
    let link = linksCache[item.id];
    if (!link) {
      try {
        const res = await fetch(
          `/api/v1/backoffice/equipe/${item.id}/reset-senha`,
          { method: "POST" },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao obter link");
        link = data.link;
        setLinksCache((prev) => ({ ...prev, [item.id]: link }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao copiar link");
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(item.id);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Erro ao copiar para a área de transferência");
    }
  }

  return (
    <>
      <table className="w-full text-sm table-auto min-w-[950px]">
        <thead>
          <tr className="border-b bg-gray-50 sticky top-0 z-10">
            <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[240px]">Nome</th>
            <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[220px]">Email</th>
            <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[170px]">Função / Tipo</th>
            <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[100px]">Status</th>
            <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[200px]">Consultores</th>
            <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 min-w-[260px]">Ações</th>
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
                          {item.tipoLideranca === "COMERCIAL"
                            ? "Comercial"
                            : "Gestor"}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-800 font-medium">
                        {item.funcao ? item.funcao.replace(/_/g, " ") : "-"}
                      </p>
                      {item.tipoLideranca && (
                        <p className="text-xs text-gray-500">
                          {item.tipoLideranca === "COMERCIAL"
                            ? "Comercial"
                            : "Gestor"}
                        </p>
                      )}
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
                  <div className="flex flex-wrap gap-1">
                    {(item.consultorPfs ?? []).length === 0 ? (
                      <span className="text-xs text-gray-400">-</span>
                    ) : (
                      item.consultorPfs!.map((cp) => (
                        <span
                          key={cp.id}
                          className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                        >
                          {cp.nome}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="p-3 border-t">
                  <div className="flex gap-1 justify-center items-center flex-wrap">
                    {item.kind === "comercial" && (
                      <Fragment>
                        <button
                          onClick={() => onEditar(item)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-1.5 py-1 rounded hover:bg-blue-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setResetModalItem(item)}
                          className="text-amber-600 hover:text-amber-800 text-xs font-medium px-1.5 py-1 rounded hover:bg-amber-50"
                          title="Reset de Senha"
                        >
                          Reset de Senha
                        </button>
                        {isPendingReset(item) && (
                          <button
                            onClick={() => handleCopiarLinkDireto(item)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium px-1.5 py-1 rounded hover:bg-indigo-50 flex items-center gap-1"
                            title="Copiar link para criar nova senha"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>Copiar Link</span>
                          </button>
                        )}
                        <button
                          onClick={() => onDeletarComercial(item.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium px-1.5 py-1 rounded hover:bg-red-50"
                        >
                          Deletar
                        </button>
                      </Fragment>
                    )}
                    {item.kind === "lideranca" && (
                      <Fragment>
                        <button
                          onClick={() => onEditar(item)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-1.5 py-1 rounded hover:bg-blue-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() =>
                            onToggleStatusLideranca(item.id, item.status)
                          }
                          className="text-xs font-medium px-2 py-1 rounded hover:bg-gray-100"
                        >
                          {item.status === "ATIVO" ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          onClick={() => setResetModalItem(item)}
                          className="text-amber-600 hover:text-amber-800 text-xs font-medium px-1.5 py-1 rounded hover:bg-amber-50"
                          title="Reset de Senha"
                        >
                          Reset de Senha
                        </button>
                        {isPendingReset(item) && (
                          <button
                            onClick={() => handleCopiarLinkDireto(item)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium px-1.5 py-1 rounded hover:bg-indigo-50 flex items-center gap-1"
                            title="Copiar link para o gestor criar nova senha"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>Copiar Link</span>
                          </button>
                        )}
                        <button
                          onClick={() => onDeletarLideranca(item.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium px-1.5 py-1 rounded hover:bg-red-50"
                        >
                          Deletar
                        </button>
                      </Fragment>
                    )}
                  </div>
                </td>
              </tr>
              <LiderancaExpanded
                item={item}
                liderancaExpandida={liderancaExpandida}
                setLiderancaExpandida={setLiderancaExpandida}
              />
            </Fragment>
          ))}
        </tbody>
      </table>

      {resetModalItem && (
        <ModalResetSenha
          open={Boolean(resetModalItem)}
          onOpenChange={(open) => {
            if (!open) setResetModalItem(null);
          }}
          usuarioNome={resetModalItem.nome}
          usuarioEmail={resetModalItem.email}
          initialLink={linksCache[resetModalItem.id] || null}
          onConfirmReset={() => handleConfirmReset(resetModalItem)}
        />
      )}
    </>
  );
}