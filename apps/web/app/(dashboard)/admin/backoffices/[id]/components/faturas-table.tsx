import type { Fatura } from "../types";
import { formatarMoeda } from "../utils";

interface FaturasTableProps {
  faturas: Fatura[];
  acaoEmAndamento: boolean;
  onMarcarPago: (faturaId: string, pago: boolean) => void;
}

export function FaturasTable({ faturas, acaoEmAndamento, onMarcarPago }: FaturasTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-2 font-medium text-gray-600">Valor</th>
            <th className="text-left p-2 font-medium text-gray-600">Vencimento</th>
            <th className="text-left p-2 font-medium text-gray-600">Status</th>
            <th className="text-left p-2 font-medium text-gray-600">Ação</th>
          </tr>
        </thead>
        <tbody>
          {faturas.map((f) => (
            <tr key={f.id} className="border-b hover:bg-gray-50">
              <td className="p-2 text-gray-900">{formatarMoeda(Number(f.valor))}</td>
              <td className="p-2 text-gray-600">
                {new Date(f.vencimento).toLocaleDateString("pt-BR")}
              </td>
              <td className="p-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    f.pagoManualmente
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {f.pagoManualmente ? "Pago" : "Pendente"}
                </span>
              </td>
              <td className="p-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={f.pagoManualmente}
                    disabled={acaoEmAndamento}
                    onChange={(e) => onMarcarPago(f.id, e.target.checked)}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className="text-xs text-gray-500">
                    {f.pagoManualmente ? "Pago" : "Dar baixa"}
                  </span>
                </label>
              </td>
            </tr>
          ))}
          {faturas.length === 0 && (
            <tr>
              <td colSpan={4} className="p-6 text-center text-gray-500">
                Nenhuma fatura cadastrada
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
