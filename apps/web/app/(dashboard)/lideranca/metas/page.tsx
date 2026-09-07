"use client";

import { useMetas } from "./hooks/use-metas";
import { MetasTable } from "./components/metas-table";

export default function MetasPage() {
  const { data, loading, anoReferencia, handleSalvarMetaLideranca } = useMetas();

  if (loading) {
    return <p className="text-sm text-gray-500">Carregando metas...</p>;
  }

  if (!data) {
    return <div className="text-center text-gray-500 py-8">Nenhum dado disponível</div>;
  }

  return (
    <div className="font-sans space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metas Anual ({data.ano})</h1>
          <p className="text-sm text-gray-500">
            Meta da Liderança + Metas dos Consultores PF
          </p>
        </div>
      </div>

      <MetasTable
        data={data}
        anoReferencia={anoReferencia}
        onSaveLideranca={handleSalvarMetaLideranca}
      />
    </div>
  );
}