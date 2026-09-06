interface FileInputSectionProps {
  loading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileInputSection({ loading, onFileChange }: FileInputSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={onFileChange}
          disabled={loading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-primary-50 file:text-primary-700
            hover:file:bg-primary-100
            disabled:opacity-50"
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Apenas arquivos Excel (.xlsx ou .xls). A planilha deve conter as
        colunas:{" "}
        <span className="font-medium">
          Data de Referência, Paciente, CPF, Procedimento, Usuário
          da conta
        </span>
      </p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      <span className="ml-3 text-gray-600">Processando planilha...</span>
    </div>
  );
}
