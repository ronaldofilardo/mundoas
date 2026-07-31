import type { ConsultorResumo, SortKey } from "./types";

export function aplicarOrdenacao(
  consultores: ConsultorResumo[],
  sort: SortKey,
): ConsultorResumo[] {
  const lista = [...consultores];
  switch (sort) {
    case "atingimento":
      lista.sort((a, b) => b.atingimento - a.atingimento);
      break;
    case "realizado":
      lista.sort((a, b) => b.realizadoAnual - a.realizadoAnual);
      break;
    case "meta":
      lista.sort((a, b) => b.metaAnual - a.metaAnual);
      break;
    case "nome":
    default:
      lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      break;
  }
  return lista;
}

export function filtrarPorNome(
  consultores: ConsultorResumo[],
  busca: string,
): ConsultorResumo[] {
  if (!busca) return consultores;
  const termo = busca.toLowerCase();
  return consultores.filter((c) => c.nome.toLowerCase().includes(termo));
}
