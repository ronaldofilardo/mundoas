export function getStatusColor(status: string) {
  switch (status) {
    case "VALIDO":
      return "bg-green-100 text-green-800";
    case "ORFAO":
      return "bg-gray-100 text-gray-700";
    case "REJEITADO":
      return "bg-red-100 text-red-800";
    case "DUPLICADA":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function getStatusText(row: { status: string; resgatadoPorConsultorPf?: boolean }) {
  if (row.status === "VALIDO" && row.resgatadoPorConsultorPf) {
    return "VALIDO (RESGATE PF)";
  }
  return row.status;
}

export function getStatusBadgeColor(row: { status: string; resgatadoPorConsultorPf?: boolean }) {
  if (row.status === "VALIDO" && row.resgatadoPorConsultorPf) {
    return "bg-emerald-100 text-emerald-800";
  }
  return getStatusColor(row.status);
}

export function gerarMesesDisponiveis() {
  const meses = [];
  const hoje = new Date();

  for (let i = 0; i < 12; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const valor = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
    const label = data.toLocaleString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    meses.push({
      value: valor,
      label: label.charAt(0).toUpperCase() + label.slice(1),
    });
  }

  return meses;
}
