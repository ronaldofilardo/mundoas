import type { UploadLinha } from "./parceiros-pontos.utils";

interface UploadPreviewProps {
  linhas: UploadLinha[];
}

export function UploadPreview({ linhas }: UploadPreviewProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-gray-700">
          Preview — {linhas.length} linha(s) encontrada(s)
        </p>
        <div className="text-xs flex gap-3">
          <span className="text-green-700">
            ✓{" "}
            {linhas.filter((l) => l.erros.length === 0).length}{" "}
            válida(s)
          </span>
          {linhas.some((l) => l.erros.length > 0) && (
            <span className="text-red-700">
              ✗{" "}
              {linhas.filter((l) => l.erros.length > 0).length}{" "}
              com erro
            </span>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto max-h-72 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left p-2 font-medium text-gray-600">
                Linha
              </th>
              <th className="text-left p-2 font-medium text-gray-600">
                Nome
              </th>
              <th className="text-left p-2 font-medium text-gray-600">
                Email
              </th>
              <th className="text-left p-2 font-medium text-gray-600">
                CPF
              </th>
              <th className="text-left p-2 font-medium text-gray-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr
                key={l.linha}
                className={
                  l.erros.length > 0
                    ? "bg-red-50"
                    : "hover:bg-gray-50"
                }
              >
                <td className="p-2 text-gray-500">{l.linha}</td>
                <td className="p-2">{l.nome || "—"}</td>
                <td className="p-2">{l.email || "—"}</td>
                <td className="p-2">{l.cpf || "—"}</td>
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
