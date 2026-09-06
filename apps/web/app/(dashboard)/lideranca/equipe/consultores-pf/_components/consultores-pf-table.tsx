"use client";

import {
  MESES_ANO,
  composeMesReferencia,
  formatarData,
} from "../utils";
import type { ConsultorPf, MetaConsultorPf } from "../types";

interface ConsultoresPfTableProps {
  consultores: ConsultorPf[];
  metasPorConsultor: Record<string, MetaConsultorPf[]>;
  anoReferencia: number;
  alternandoId: string | null;
  onEditar: (c: ConsultorPf) => void;
  onAlternarStatus: (c: ConsultorPf) => void;
  onSalvarMeta: (consultorId: string, mesRef: string, rawValor: string) => void;
}

export function ConsultoresPfTable({
  consultores,
  metasPorConsultor,
  anoReferencia,
  alternandoId,
  onEditar,
  onAlternarStatus,
  onSalvarMeta,
}: ConsultoresPfTableProps) {
  return (
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
                    onClick={() => onEditar(c)}
                    className="px-2 py-0.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
                    title="Editar consultor"
                    aria-label={`Editar ${c.nome}`}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onAlternarStatus(c)}
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
                          onSalvarMeta(c.id, mesRef, e.target.value);
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
  );
}