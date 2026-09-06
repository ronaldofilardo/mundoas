import { Fragment } from "react";
import type { Comercial, RegrasComerciais, RegrasGestores } from "../../usuarios/comerciais/types";
import { formatCpf } from "../../usuarios/comerciais/utils";
import { getComissaoFromFuncao } from "@/lib/comissao-calculo";
import { MetaRow } from "./meta-row";
import { ProducaoRow } from "./producao-row";
import { ComissaoRow } from "./comissao-row";

export interface ComerciaisTableRowProps {
  c: Comercial;
  metaVersion: number;
  metasInputs: Record<string, Record<string, string>>;
  producaoInputs: Record<string, Record<string, string>>;
  comissaoInputs: Record<string, Record<string, string>>;
  regrasComerciais: RegrasComerciais | null;
  regrasGestores: RegrasGestores | null;
  onEditar: (id: string) => void;
  onDeletar: (id: string) => void;
  onChangeMeta: (comercialId: string, mes: string, valor: string) => void;
  onChangeProducao: (comercialId: string, mes: string, valor: string) => void;
  onSalvarMeta: (comercialId: string, mes: string, valor: string) => void;
  onSalvarProducao: (comercialId: string, mes: string, valor: string) => void;
}

export function ComerciaisTableRow(props: ComerciaisTableRowProps) {
  const { c, onEditar, onDeletar } = props;
  const isLideranca = c.isLideranca === true;
  const isConsultorPf = c.isConsultorPf === true;

  return (
    <Fragment key={c.id}>
      <tr className="hover:bg-gray-50">
        <td className="p-2 align-top border-t" rowSpan={3}>
          <button onClick={() => onEditar(c.id)} className="text-left hover:text-primary-600 hover:underline">
            <p className="font-medium text-gray-900 truncate">{c.nome}</p>
            <p className="text-xs text-gray-500">{formatCpf(c.cpf)}</p>
          </button>
        </td>
        <td className="p-2 align-top border-t" rowSpan={3}>
          <p className="text-xs text-gray-600">{c.funcao ? c.funcao.replace(/_/g, " ") : "-"}</p>
          <p className="text-xs text-gray-500">{c.status}</p>
          {isLideranca && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-medium rounded">
              {c.tipoLideranca === "GESTOR" ? "Líder Gestor" : "Líder Comercial"}
            </span>
          )}
          {isConsultorPf && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-medium rounded">
              Consultor PF
            </span>
          )}
          {c.funcao && c.funcao !== "LIDER_COMERCIAL" && c.funcao !== "LIDER_GESTOR" && (() => {
            const pct = getComissaoFromFuncao({ regrasComerciais: props.regrasComerciais, regrasGestores: props.regrasGestores }, c.funcao);
            return (
              <p className="text-[10px] text-emerald-700 mt-1" title="Percentual da regra para esta função">
                Regra: {pct.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
              </p>
            );
          })()}
        </td>
        <td className="p-1 text-center align-top border-t" rowSpan={3}>
          <div className="flex flex-col gap-1 items-center">
            <button
              onClick={() => onEditar(c.id)}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded hover:bg-blue-50"
              title="Editar"
            >
              Editar
            </button>
            <button
              onClick={() => onDeletar(c.id)}
              className="text-red-600 hover:text-red-800 text-xs font-medium px-1.5 py-0.5 rounded hover:bg-red-50"
              title="Deletar"
            >
              Deletar
            </button>
          </div>
        </td>
      </tr>
      <MetaRow
        c={c}
        metaVersion={props.metaVersion}
        metasInputs={props.metasInputs}
        onChangeMeta={props.onChangeMeta}
        onSalvarMeta={props.onSalvarMeta}
      />
      <ProducaoRow
        c={c}
        metaVersion={props.metaVersion}
        producaoInputs={props.producaoInputs}
        onChangeProducao={props.onChangeProducao}
        onSalvarProducao={props.onSalvarProducao}
      />
      <ComissaoRow
        c={c}
        metaVersion={props.metaVersion}
        comissaoInputs={props.comissaoInputs}
        regrasComerciais={props.regrasComerciais}
        regrasGestores={props.regrasGestores}
      />
    </Fragment>
  );
}
