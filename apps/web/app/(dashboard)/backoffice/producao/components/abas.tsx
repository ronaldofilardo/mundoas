interface AbasProps {
  activeTab: "lista" | "upload";
  onTabChange: (tab: "lista" | "upload") => void;
}

export function Abas({ activeTab, onTabChange }: AbasProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-1">
        <button
          onClick={() => onTabChange("lista")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === "lista"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📋 Lista de Produção
        </button>
        <button
          onClick={() => onTabChange("upload")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === "upload"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📥 Upload de Planilha
        </button>
      </nav>
    </div>
  );
}