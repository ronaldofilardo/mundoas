interface ProducaoPaginacaoProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ProducaoPaginacao({
  currentPage,
  totalPages,
  onPageChange,
}: ProducaoPaginacaoProps) {
  return (
    <div className="flex justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 text-xs border rounded disabled:opacity-50"
      >
        Anterior
      </button>
      <span className="text-xs text-gray-500 py-1">
        {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 text-xs border rounded disabled:opacity-50"
      >
        Próxima
      </button>
    </div>
  );
}