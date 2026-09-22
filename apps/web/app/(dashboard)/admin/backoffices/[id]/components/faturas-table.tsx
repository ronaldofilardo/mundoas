import type { Fatura } from "../types";
import { formatarMoeda, formatarData } from "../utils";

// Calcula dias de atraso de forma simples (sem depender do servidor)
function calcularDiasAtrasoClient(vencimento: string): number {
  const match = vencimento.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return 0;
  const [, ano, mes, dia] = match.map(Number);
  const utcVenc = Date.UTC(ano, mes - 1, dia);
  const hoje = new Date();
  const utcHoje = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.floor((utcHoje - utcVenc) / 86_400_000);
}

interface FaturasTableProps {
  faturas: Fatura[];
  backofficeId?: string;
  acaoEmAndamento: boolean;
  onMarcarPago: (faturaId: string, pago: boolean) => void;
  onReenviar?: (faturaId: string) => void;
}

export function FaturasTable({
  faturas,
  acaoEmAndamento,
  onMarcarPago,
  onReenviar,
}: FaturasTableProps) {
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
          {faturas.map((f) => {
            const diasAtraso = f.pagoManualmente ? -1 : calcularDiasAtrasoClient(f.vencimento);
            const atrasada15Dias = diasAtraso >= 15;
            const bloqueavel = diasAtraso > 15;
            const linkPagar = f.linkFatura || f.linkBoleto;

            return (
              <tr key={f.id} className={`border-b hover:bg-gray-50 ${bloqueavel ? "bg-red-50/40" : ""}`}>
                <td className="p-2 text-gray-900">{formatarMoeda(Number(f.valor))}</td>
                <td className="p-2 text-gray-600">
                  <div className="flex flex-col gap-0.5">
                    <span>{formatarData(f.vencimento)}</span>
                    {!f.pagoManualmente && diasAtraso > 0 && (
                      <span
                        className={`text-[10px] font-medium ${
                          bloqueavel ? "text-red-600" : "text-amber-600"
                        }`}
                      >
                        {diasAtraso} dia{diasAtraso !== 1 ? "s" : ""} de atraso
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`px-2 py-1 rounded text-xs w-fit ${
                        f.pagoManualmente
                          ? "bg-green-100 text-green-800"
                          : bloqueavel
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {f.pagoManualmente ? "Pago" : bloqueavel ? "⚠️ Inadimplente" : "Pendente"}
                    </span>
                    {!f.pagoManualmente && atrasada15Dias && (
                      <span className="text-[10px] text-red-600 font-semibold">
                        ≥ 15 dias — elegível p/ reenvio
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex flex-col gap-2">
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

                    {!f.pagoManualmente && atrasada15Dias && onReenviar && (
                      <button
                        type="button"
                        disabled={acaoEmAndamento}
                        onClick={() => onReenviar(f.id)}
                        className="text-[11px] text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-2 py-1 rounded font-medium transition w-fit"
                      >
                        📨 Reenviar cobrança
                      </button>
                    )}

                    {!f.pagoManualmente && linkPagar && (
                      <a
                        href={linkPagar}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-600 hover:underline"
                      >
                        Ver link ↗
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
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
