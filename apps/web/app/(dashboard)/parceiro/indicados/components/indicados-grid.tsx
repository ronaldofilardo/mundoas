"use client";

import { formatCpf } from "@/app/(dashboard)/parceiro/indicados/utils";
import type { Indicado } from "@/app/(dashboard)/parceiro/indicados/types";

export interface IndicadosGridProps {
  indicados: Indicado[];
}

export default function IndicadosGrid({ indicados }: IndicadosGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {indicados.map((i) => (
        <div key={i.id} className="card hover:shadow-md transition-smooth">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-900">{i.nome}</p>
              <p className="text-xs text-gray-500">{formatCpf(i.cpf)}</p>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${i.status === "ATIVO" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {i.status === "ATIVO" ? "Ativo" : "Inativo"}
            </span>
          </div>
          {i.telefone && (
            <p className="text-xs text-gray-500 mb-2">📞 {i.telefone}</p>
          )}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-xs text-gray-500">
              Desde {i.createdAt ? new Date(i.createdAt).toLocaleString("pt-BR") : "-"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}