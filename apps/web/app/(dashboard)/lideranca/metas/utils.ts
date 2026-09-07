import type { MetasResponse } from "./types";

export function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function getCorPercentual(p: number) {
  if (p >= 100) return "text-green-600";
  if (p >= 80) return "text-yellow-600";
  return "text-red-600";
}

export function calcularPercentual(meta: number, atingido: number) {
  return meta > 0 ? Math.round((atingido / meta) * 100) : 0;
}

export function calcularTotaisLideranca(meses: MetasResponse["meses"]) {
  const totalMeta = meses.reduce((s, m) => s + m.lideranca.meta, 0);
  const totalAtingido = meses.reduce((s, m) => s + m.lideranca.atingido, 0);
  return {
    totalMeta,
    totalAtingido,
    totalPercentual: calcularPercentual(totalMeta, totalAtingido),
  };
}

export function calcularTotaisEquipe(meses: MetasResponse["meses"]) {
  const totalMeta = meses.reduce((s, m) => s + m.totais.meta, 0);
  const totalAtingido = meses.reduce((s, m) => s + m.totais.atingido, 0);
  return {
    totalMeta,
    totalAtingido,
    totalPercentual: calcularPercentual(totalMeta, totalAtingido),
  };
}