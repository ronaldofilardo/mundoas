function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function BarraProgresso({
  atingimento,
  tamanho = "md",
}: {
  atingimento: number;
  tamanho?: "sm" | "md";
}) {
  const widthPct = clamp(atingimento, 0, 100);
  const atingido = atingimento >= 100;
  const corBarra = atingido ? "bg-emerald-500" : "bg-orange-500";
  const altura = tamanho === "sm" ? "h-1.5" : "h-2";

  return (
    <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${altura}`}>
      <div
        className={`${corBarra} ${altura} rounded-full transition-all duration-300`}
        style={{ width: `${widthPct}%` }}
        aria-valuenow={Math.round(atingimento)}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
      />
    </div>
  );
}
