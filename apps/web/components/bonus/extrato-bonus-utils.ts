export function formatarDataHora(
  dataIso: string | Date | null | undefined,
): string {
  if (!dataIso) return "—";
  const d = new Date(dataIso);
  if (isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " às " +
    d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

export function getOrigemBadgeConfig(origem: string, tipo: string): {
  label: string;
  className: string;
} {
  if (origem === "PRODUCAO_PF") {
    return {
      label: "Produção",
      className: "bg-blue-100 text-blue-800",
    };
  }

  if (origem === "AJUSTE_MANUAL") {
    if (tipo === "DEBITO") {
      return {
        label: "Retirada BackOffice",
        className: "bg-orange-100 text-orange-800",
      };
    }
    return {
      label: "Inserção BackOffice",
      className: "bg-emerald-100 text-emerald-800",
    };
  }

  if (origem === "RESGATE") {
    return {
      label: "Resgate de Prêmio",
      className: "bg-violet-100 text-violet-800",
    };
  }

  if (origem === "RESET_ADMINISTRATIVO") {
    return {
      label: "Reset Administrativo",
      className: "bg-red-100 text-red-800",
    };
  }

  return {
    label: origem.replace(/_/g, " "),
    className: "bg-gray-100 text-gray-700",
  };
}
