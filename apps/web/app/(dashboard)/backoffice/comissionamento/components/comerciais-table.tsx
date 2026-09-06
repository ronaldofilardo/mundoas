import type { Comercial, RegrasComerciais, RegrasGestores } from "../../usuarios/comerciais/types";
import { ComerciaisTableRow } from "./comerciais-table-row";

const mesesAno = [
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

export interface ComerciaisTableProps {
  comerciais: Comercial[];
  metaVersion: number;
  metasInputs: Record<string, Record<string, string>>;
  producaoInputs: Record<string, Record<string, string>>;
  comissaoInputs: Record<string, Record<string, string>>;
  metasAlteradas: Set<string>;
  producaoAlteradas: Set<string>;
  regrasComerciais: RegrasComerciais | null;
  regrasGestores: RegrasGestores | null;
  onEditar: (id: string) => void;
  onDeletar: (id: string) => void;
  onChangeMeta: (comercialId: string, mes: string, valor: string) => void;
  onChangeProducao: (comercialId: string, mes: string, valor: string) => void;
  onSalvarMeta: (comercialId: string, mes: string, valor: string) => void;
  onSalvarProducao: (comercialId: string, mes: string, valor: string) => void;
  loadingMetasGerais: boolean;
}

export function ComerciaisTable({
  comerciais,
  metaVersion,
  metasInputs,
  producaoInputs,
  comissaoInputs,
  metasAlteradas,
  producaoAlteradas,
  regrasComerciais,
  regrasGestores,
  onEditar,
  onDeletar,
  onChangeMeta,
  onChangeProducao,
  onSalvarMeta,
  onSalvarProducao,
  loadingMetasGerais,
}: ComerciaisTableProps) {
  const totalAlteradas = metasAlteradas.size + producaoAlteradas.size;

  if (loadingMetasGerais) {
    return <p className="text-sm text-gray-500">Carregando metas...</p>;
  }

  if (comerciais.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Nenhum comercial cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-auto flex-grow max-h-[600px]">
      <table className="w-full text-sm table-auto min-w-[1500px]">
        <colgroup>
          <col style={{ width: "170px" }} />
          <col style={{ width: "110px" }} />
          <col style={{ width: "95px" }} />
          <col style={{ width: "75px" }} />
          {mesesAno.map((m) => (
            <col key={m.value} style={{ width: "92px" }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b bg-gray-50 sticky top-0 z-10">
            <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">Comercial</th>
            <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">Função</th>
            <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50">Ações</th>
            <th className="text-left p-2 font-semibold text-gray-700 bg-gray-50"></th>
            {mesesAno.map((m) => (
              <th key={m.value} className="text-center p-2 font-semibold text-gray-700 whitespace-nowrap">
                {m.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comerciais.map((c) => (
            <ComerciaisTableRow
              key={c.id}
              c={c}
              metaVersion={metaVersion}
              metasInputs={metasInputs}
              producaoInputs={producaoInputs}
              comissaoInputs={comissaoInputs}
              regrasComerciais={regrasComerciais}
              regrasGestores={regrasGestores}
              onEditar={onEditar}
              onDeletar={onDeletar}
              onChangeMeta={onChangeMeta}
              onChangeProducao={onChangeProducao}
              onSalvarMeta={onSalvarMeta}
              onSalvarProducao={onSalvarProducao}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
