interface UploadResultadoDetalhe {
  linha: number;
  nome?: string;
  status: "sucesso" | "erro";
  mensagem: string;
}

interface UploadResultado {
  total: number;
  sucesso: number;
  erros: number;
  criados: number;
  detalhes: UploadResultadoDetalhe[];
}

interface UploadResultProps {
  resultado: UploadResultado;
}

export function UploadResult({ resultado }: UploadResultProps) {
  return (
    <div className="space-y-3">
      <div
        className={`rounded-lg p-3 text-sm ${
          resultado.criados > 0
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
        }`}
      >
        <p className="font-semibold">
          Importação concluída: {resultado.criados} criado(s),{" "}
          {resultado.erros} erro(s)
        </p>
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
                Status
              </th>
              <th className="text-left p-2 font-medium text-gray-600">
                Mensagem
              </th>
            </tr>
          </thead>
          <tbody>
            {resultado.detalhes.map((d, idx) => (
              <tr
                key={idx}
                className={
                  d.status === "erro"
                    ? "bg-red-50"
                    : "hover:bg-gray-50"
                }
              >
                <td className="p-2 text-gray-500">{d.linha}</td>
                <td className="p-2">{d.nome || "—"}</td>
                <td className="p-2">
                  {d.status === "sucesso" ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Sucesso
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Erro
                    </span>
                  )}
                </td>
                <td className="p-2 text-gray-700">
                  {d.mensagem}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
