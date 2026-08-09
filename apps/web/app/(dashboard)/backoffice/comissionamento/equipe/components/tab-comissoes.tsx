"use client";

import { useState } from "react";
import { formatCpf, formatBRL } from "../../../usuarios/comerciais/utils";
import type { EquipeItem } from "../types";
import { useEquipeComissoes } from "../hooks/use-equipe-comissoes";

interface TabComissoesProps {
  itens: EquipeItem[];
}

export function TabComissoes({ itens }: TabComissoesProps) {
  const [selecionado, setSelecionado] = useState<EquipeItem | null>(
    itens[0] ?? null,
  );
  const { comissoes, loading } = useEquipeComissoes(selecionado?.id ?? null);

  function formatarStatus(status: string) {
    const map: Record<string, { label: string; cls: string }> = {
      PENDENTE: { label: "Pendente", cls: "bg-yellow-100 text-yellow-800" },
      CALCULADA: { label: "Calculada", cls: "bg-blue-100 text-blue-800" },
      PAGA: { label: "Paga", cls: "bg-green-100 text-green-800" },
    };
    return map[status] ?? { label: status, cls: "bg-gray-100 text-gray-800" };
  }

  if (itens.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Nenhum membro da equipe cadastrado.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <label htmlFor="membro-comissoes" className="text-sm font-medium text-gray-700">
          Membro:
        </label>
        <select
          id="membro-comissoes"
          value={selecionado?.id ?? ""}
          onChange={(e) => {
            const m = itens.find((i) => i.id === e.target.value) ?? null;
            setSelecionado(m);
          }}
          className="px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
        >
          {itens.map((m) => (
            <option key={`${m.kind}-${m.id}`} value={m.id}>
              {m.nome} ({m.kind === "lideranca" ? "Liderança" : "Comercial"})
            </option>
          ))}
        </select>
        {selecionado && (
          <span className="text-xs text-gray-500">
            {formatCpf(selecionado.cpf)} · {selecionado.email}
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Carregando comissões...</p>
      ) : comissoes.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nenhuma comissão registrada para este membro.
        </p>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto min-w-[700px]">
              <thead>
                <tr className="border-b bg-gray-50 sticky top-0 z-10">
                  <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">
                    Mês de referência
                  </th>
                  <th className="text-right p-3 font-semibold text-gray-700 bg-gray-50">
                    Vendas
                  </th>
                  <th className="text-right p-3 font-semibold text-gray-700 bg-gray-50">
                    Comissão
                  </th>
                  <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50">
                    Status
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">
                    Pagamento
                  </th>
                </tr>
              </thead>
              <tbody>
                {comissoes.map((c) => {
                  const sts = formatarStatus(c.status);
                  return (
                    <tr key={c.id ?? c.mesReferencia} className="border-b hover:bg-gray-50">
                      <td className="p-3">{c.mesReferencia}</td>
                      <td className="p-3 text-right">
                        {formatBRL(c.valorVendas)}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatBRL(c.valorComissao)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${sts.cls}`}
                        >
                          {sts.label}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-gray-600">
                        {c.dataPagamento
                          ? new Date(c.dataPagamento).toLocaleDateString("pt-BR")
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
