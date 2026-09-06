import type { LinhaPlanilha } from "@/lib/upload/consultores-pf/types";

interface PreviewTableProps {
  linhas: LinhaPlanilha[];
  setoresValidos: string[];
}

export function PreviewTable({ linhas, setoresValidos }: PreviewTableProps) {
  const linhasValidas = linhas.filter((l) => l.erros.length === 0).length;
  const linhasInvalidas = linhas.length - linhasValidas;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-gray-700">
          Preview — {linhas.length} linha(s) encontrada(s)
        </p>
        <div className="text-xs flex gap-3">
          <span className="text-green-700">
            ✓ {linhasValidas} válida(s)
          </span>
          {linhasInvalidas > 0 && (
            <span className="text-red-700">
              ✗ {linhasInvalidas} com erro
            </span>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto max-h-72 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left p-2 font-medium text-gray-600">Linha</th>
              <th className="text-left p-2 font-medium text-gray-600">Nome</th>
              <th className="text-left p-2 font-medium text-gray-600">Email</th>
              <th className="text-left p-2 font-medium text-gray-600">CPF</th>
              <th className="text-left p-2 font-medium text-gray-600">Telefone</th>
              <th className="text-left p-2 font-medium text-gray-600">Setores</th>
              <th className="text-left p-2 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr
                key={l.linhaOriginal}
                className={
                  l.erros.length > 0
                    ? "bg-red-50"
                    : "hover:bg-gray-50"
                }
              >
                <td className="p-2 text-gray-500">{l.linhaOriginal}</td>
                <td className="p-2">{l.nome || "—"}</td>
                <td className="p-2">{l.email || "—"}</td>
                <td className="p-2">{l.cpf || "—"}</td>
                <td className="p-2">{l.telefone || "—"}</td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    {l.setoresParsed.length > 0 ? (
                      l.setoresParsed.map((s, idx) => {
                        const invalido = !setoresValidos.includes(s);
                        return (
                          <span
                            key={`${l.linhaOriginal}-${idx}`}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              invalido
                                ? "bg-red-100 text-red-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {s}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </td>
                <td className="p-2">
                  {l.erros.length === 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      OK
                    </span>
                  ) : (
                    <div className="space-y-0.5">
                      {l.erros.map((erro, idx) => (
                        <p
                          key={idx}
                          className="text-xs text-red-700"
                        >
                          {erro}
                        </p>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
