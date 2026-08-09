"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatCpf } from "../../../usuarios/comerciais/utils";
import type { EquipeItem } from "../types";
import { useEquipeMetas } from "../hooks/use-equipe-metas";

const MESES = [
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
];

interface TabMetasProps {
  itens: EquipeItem[];
}

export function TabMetas({ itens }: TabMetasProps) {
  const { metasPorMembro, loading } = useEquipeMetas(itens);
  const [anoReferencia] = useState(new Date().getFullYear());
  const [showInativos, setShowInativos] = useState(false);

  const itensVisiveis = useMemo(
    () => itens.filter((i) => showInativos || i.status === "ATIVO"),
    [itens, showInativos],
  );

  async function handleSalvarMeta(
    membroId: string,
    mes: string,
    valor: string,
  ) {
    const num = parseFloat(valor);
    if (Number.isNaN(num) || num < 0) {
      toast.error("Valor inválido");
      return;
    }
    try {
      const res = await fetch(`/api/v1/backoffice/equipe/${membroId}/metas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesReferencia: mes, valorMeta: num }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as { error?: string }).error || "Erro ao salvar meta");
        return;
      }
      toast.success("Meta salva");
    } catch {
      toast.error("Erro ao salvar meta");
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Carregando metas...</p>;
  }

  if (itensVisiveis.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Nenhum membro da equipe cadastrado.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Metas Anual ({anoReferencia})
        </h2>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showInativos}
            onChange={(e) => setShowInativos(e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          Mostrar inativos
        </label>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto min-w-[900px]">
            <thead>
              <tr className="border-b bg-gray-50 sticky top-0 z-10">
                <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[240px]">
                  Membro
                </th>
                <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[140px]">
                  CPF
                </th>
                <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[150px]">
                  Papel
                </th>
                {MESES.map((m) => (
                  <th
                    key={m.value}
                    className="text-center p-2 font-semibold text-gray-700 bg-gray-50"
                  >
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itensVisiveis.map((m) => {
                const metas = metasPorMembro[m.id] ?? [];
                const papel =
                  m.kind === "lideranca"
                    ? `Liderança · ${m.tipoLideranca === "COMERCIAL" ? "Comercial" : "Gestor"}`
                    : m.funcao
                      ? m.funcao.replace(/_/g, " ")
                      : "Comercial";
                return (
                  <tr
                    key={`${m.kind}-${m.id}`}
                    className={`border-b hover:bg-gray-50 ${m.status === "INATIVO" ? "opacity-50" : ""}`}
                  >
                    <td className="p-3">
                      <p className="font-medium text-gray-900 truncate">{m.nome}</p>
                      <p className="text-xs text-gray-500 truncate">{m.email}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-xs text-gray-600">{formatCpf(m.cpf)}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-xs text-gray-800 font-medium truncate">
                        {papel}
                      </p>
                      <p className="text-xs text-gray-500">{m.status}</p>
                    </td>
                    {MESES.map((mLabel) => {
                      const mesRef = `${anoReferencia}-${mLabel.value}`;
                      const meta = metas.find(
                        (mt) => mt.mesReferencia === mesRef,
                      );
                      const valor = meta ? Number(meta.valorMeta) : "";
                      return (
                        <td key={mLabel.value} className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={valor || ""}
                            placeholder="R$"
                            className="w-full px-2 py-1 border rounded text-xs text-center focus-ring"
                            onBlur={(e) => {
                              const v = e.target.value;
                              if (v) {
                                handleSalvarMeta(m.id, mesRef, v);
                              }
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
