"use client";

import { useMemo } from "react";
import type { EquipeItem } from "../types";
import { getComissaoFromFuncao } from "@/lib/comissao-calculo";
import { calcularValorComissaoNum } from "@/lib/comissao-calculo";
import type { MetaEquipe } from "../hooks/use-equipe-metas";
import type { RegrasComerciais, RegrasGestores } from "../../../usuarios/comerciais/types";
import { toast } from "sonner";

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

interface MetasTabelaProps {
  itensVisiveis: EquipeItem[];
  metasPorMembro: Record<string, any>;
  mesRefSelecionado: string;
  mesSelecionado: string;
  regrasComerciais: RegrasComerciais | null;
  regrasGestores: RegrasGestores | null;
  producaoRecemSalva: Record<string, number>;
  onSalvarMeta: (membroId: string, mesRef: string, valor: string) => void;
  onSalvarProducao: (
    membroId: string,
    mes: string,
    valor: string,
    funcao?: string,
  ) => void;
}

export function MetasTabela({
  itensVisiveis,
  metasPorMembro,
  mesRefSelecionado,
  mesSelecionado,
  regrasComerciais,
  regrasGestores,
  producaoRecemSalva,
  onSalvarMeta,
  onSalvarProducao,
}: MetasTabelaProps) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-auto min-w-[800px]">
          <colgroup>
            <col style={{ width: "280px" }} />
            <col style={{ width: "160px" }} />
            <col style={{ width: "160px" }} />
            <col style={{ width: "160px" }} />
          </colgroup>
          <thead>
            <tr className="border-b bg-gray-50 sticky top-0 z-10">
              <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[280px]">
                Empresa/Setor
              </th>
              <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[160px]">
                Meta
              </th>
              <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[160px]">
                Produzido
              </th>
              <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[160px]">
                Projeção
              </th>
            </tr>
          </thead>
          <tbody>
            {itensVisiveis.map((m) => {
              const metas = metasPorMembro[m.id] ?? [];
              const meta = metas.find((mt: MetaEquipe) => mt.mesReferencia === mesRefSelecionado);
              const valorMeta = meta ? Number(meta.valorMeta) : 0;
              const valorRecemSalvo = producaoRecemSalva[keyRecemSalva(m.id, mesRefSelecionado)];
              const valorAtingido = valorRecemSalvo !== undefined
                ? valorRecemSalvo
                : (meta ? Number(meta.valorAtingido) : 0);

              const funcao =
                m.funcao && m.funcao.trim() !== ""
                  ? m.funcao.replace(/_/g, " ")
                  : undefined;

              const pct = getComissaoFromFuncao(
                { regrasComerciais, regrasGestores },
                funcao,
              );
              const projecao = pct && valorAtingido > 0
                ? calcularValorComissaoNum(String(valorAtingido), pct)
                : 0;

              const nomeExibicao = m.kind === "comercial"
                ? m.nome
                : m.kind === "lideranca"
                  ? `${m.nome} (Liderança)`
                  : m.nome;

              return (
                <tr
                  key={`${m.kind}-${m.id}-${mesSelecionado}`}
                  className={`border-b hover:bg-gray-50 ${m.status === "INATIVO" ? "opacity-50" : ""}`}
                >
                  <td className="p-3">
                    <p className="font-medium text-gray-900 truncate">{nomeExibicao}</p>
                    <p className="text-xs text-gray-500 truncate">{m.email}</p>
                    <p className="text-xs text-gray-400">{funcao ?? "-"} • {m.status}</p>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs text-gray-500">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={valorMeta || ""}
                        key={`meta-${m.id}-${mesSelecionado}`}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (val) onSalvarMeta(m.id, mesRefSelecionado, val);
                        }}
                        placeholder="0"
                        className="w-[120px] px-2 py-1 border rounded text-xs text-center focus-ring"
                      />
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs text-gray-500">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={valorAtingido || ""}
                        key={`producao-${m.id}-${mesSelecionado}-${valorAtingido}`}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (val) onSalvarProducao(m.id, mesRefSelecionado, val, funcao);
                        }}
                        placeholder="0"
                        className="w-[120px] px-2 py-1 border rounded text-xs text-center focus-ring"
                      />
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div
                      className="flex items-center justify-center gap-1"
                      aria-readonly="true"
                    >
                      <span className="text-xs text-gray-500">R$</span>
                      <span
                        data-testid={`projecao-${m.id}`}
                        className="w-[120px] px-2 py-1 text-xs text-center text-emerald-700 font-semibold tabular-nums"
                        title="Resultado calculado: Produzido × regra do membro"
                      >
                        {projecao.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      {pct > 0 && valorAtingido > 0 && (
                        <span className="text-[10px] text-gray-400 ml-1">
                          ({pct}%)
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function keyRecemSalva(membroId: string, mesRef: string) {
  return `${membroId}__${mesRef}`;
}