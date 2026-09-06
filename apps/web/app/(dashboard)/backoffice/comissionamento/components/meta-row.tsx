import type { Comercial } from "../../usuarios/comerciais/types";

export interface MetaRowProps {
  c: Comercial;
  metaVersion: number;
  metasInputs: Record<string, Record<string, string>>;
  onChangeMeta: (comercialId: string, mes: string, valor: string) => void;
  onSalvarMeta: (comercialId: string, mes: string, valor: string) => void;
}

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

export function MetaRow({ c, metaVersion, metasInputs, onChangeMeta, onSalvarMeta }: MetaRowProps) {
  const anoReferencia = new Date().getFullYear();
  return (
    <tr className="hover:bg-gray-50">
      <td className="p-1 border-t">
        <span className="text-[11px] font-medium text-gray-500">Meta</span>
      </td>
      {mesesAno.map((m) => {
        const mesRef = `${anoReferencia}-${m.value}`;
        return (
          <td key={`meta-${m.value}-${metaVersion}`} className="p-1 border-t">
            <input
              type="text"
              inputMode="decimal"
              value={metasInputs[c.id]?.[mesRef] ?? ""}
              placeholder="R$ 0,00"
              className="w-full px-2 py-1 border rounded text-xs text-right font-mono focus-ring"
              onChange={(e) => onChangeMeta(c.id, mesRef, e.target.value)}
              onBlur={(e) => {
                const valor = e.target.value;
                if (valor) {
                  onSalvarMeta(c.id, mesRef, valor);
                }
              }}
            />
          </td>
        );
      })}
    </tr>
  );
}
