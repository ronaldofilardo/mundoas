"use client";

interface Premio {
  id: string;
  codigo: string;
  tipo: string;
  descricao: string;
  custoPontos: number;
  prazoEntregaDias: number;
  ativo: boolean;
}

const tipoLabels: Record<string, string> = {
  PRODUTO: "Produto",
  SERVICO: "Serviço",
  EXPERIENCIA: "Experiência",
  VOUCHER: "Voucher",
};

export function PremiosTable({ data, onEdit, onDelete }: { data: Premio[]; onEdit: (premio: Premio) => void; onDelete: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {[
                "CÓDIGO", "TIPO", "DESCRIÇÃO", "PONTOS", "PRAZO", "AÇÕES",
              ].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!data || data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">Nenhum prêmio cadastrado</td>
              </tr>
            ) : data.map((premio) => (
              <tr key={premio.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-4 text-sm text-gray-900">{premio.codigo}</td>
                <td className="px-4 py-4 text-sm">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                    {tipoLabels[premio.tipo] ?? premio.tipo}
                  </span>
                </td>
                <td className="max-w-[320px] px-4 py-4 text-sm text-gray-700">{premio.descricao}</td>
                <td className="px-4 py-4 text-sm font-semibold text-gray-900">{premio.custoPontos}</td>
                <td className="px-4 py-4 text-sm text-gray-700">{premio.prazoEntregaDias ?? 0} dias</td>
                <td className="px-4 py-4 text-sm">
                  <div className="flex gap-3">
                    <button type="button" onClick={() => onEdit(premio)} className="font-medium text-blue-600 hover:text-blue-800">Editar</button>
                    <button type="button" onClick={() => onDelete(premio.id)} className="font-medium text-red-600 hover:text-red-800">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}