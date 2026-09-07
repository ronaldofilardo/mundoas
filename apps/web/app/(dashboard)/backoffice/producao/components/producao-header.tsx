interface ProducaoHeaderProps {
  activeTab: "lista" | "upload";
  totalComissao: number;
}

export function ProducaoHeader({ activeTab, totalComissao }: ProducaoHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Produção</h1>
        <p className="text-sm text-gray-500">
          {activeTab === "lista"
            ? "Lista corrida de todos os procedimentos com comissões"
            : "Faça upload da planilha de procedimentos"}
        </p>
      </div>
      <div className="flex gap-6 text-right">
        <div>
          <p className="text-xs text-gray-500">Total Comissões</p>
          <p className="text-lg font-bold text-green-600">
            R$ {totalComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}