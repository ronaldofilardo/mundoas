import type { Procedimento } from "./types";

export function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatCpf(cpf: string) {
  if (!cpf || cpf.length < 11) return cpf || "-";
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatMes(mes: string) {
  if (!mes) return "-";
  const [ano, mesNum] = mes.split("-");
  const date = new Date(Number(ano), Number(mesNum) - 1);
  return date.toLocaleString("pt-BR", { month: "long", year: "numeric" });
}

export function filterProcedimentos(
  procedimentos: Procedimento[],
  filterSearch: string,
  filterConsultorPf: string,
) {
  return procedimentos.filter((p) => {
    if (filterSearch) {
      const search = filterSearch.toLowerCase();
      return (
        p.paciente.toLowerCase().includes(search) ||
        p.procedimento.toLowerCase().includes(search) ||
        p.cpf.includes(search) ||
        p.unidade.toLowerCase().includes(search) ||
        p.formaPagamento.toLowerCase().includes(search) ||
        (p.comercial?.nome || "").toLowerCase().includes(search) ||
        (p.consultorPf?.nome || "").toLowerCase().includes(search)
      );
    }
    if (filterConsultorPf && p.consultorPf?.id !== filterConsultorPf) {
      return false;
    }
    return true;
  });
}

export function calcularTotalComissao(procedimentos: Procedimento[]) {
  return (
    procedimentos.reduce((sum, p) => sum + Number(p.valorComissao), 0) || 0
  );
}