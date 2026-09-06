import type { Comercial, RegrasComerciais, RegrasGestores } from "../../usuarios/comerciais/types";
import { calcularValorComissao, getComissaoFromFuncao } from "@/lib/comissao-calculo";

export interface ComissaoRowProps {
  c: Comercial;
  metaVersion: number;
  comissaoInputs: Record<string, Record<string, string>>;
  regrasComerciais: RegrasComerciais | null;
  regrasGestores: RegrasGestores | null;
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

export function ComissaoRow({ c, metaVersion, comissaoInputs, regrasComerciais, regrasGestores }: ComissaoRowProps) {
  const anoReferencia = new Date().getFullYear();
  const percentualRegra = getComissaoFromFuncao({ regrasComerciais, regrasGestores }, c.funcao);
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-1">
        <span className="text-[11px] font-medium text-gray-500">Comissão</span>
      </td>
      {mesesAno.map((m) => {
        const mesRef = `${anoReferencia}-${m.value}`;
        const producaoMes = comissaoInputs[c.id]?.[mesRef];
        const valorCalculado = calcularValorComissao(producaoMes, percentualRegra);
        return (
          <td key={`comissao-${m.value}-${metaVersion}`} className="p-1">
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={valorCalculado}
              placeholder="R$ 0,00"
              title={`Produção × regra (${percentualRegra.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)`}
              className="w-full px-2 py-1 border rounded text-xs text-right font-mono bg-green-50/60 text-gray-700 cursor-not-allowed"
            />
          </td>
        );
      })}
    </tr>
  );
}
