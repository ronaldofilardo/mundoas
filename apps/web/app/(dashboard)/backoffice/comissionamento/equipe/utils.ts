export function mapEquipeItemToComercial(item: EquipeItem): Comercial {
  const lideranca = item.tipoLideranca
    ? (item.tipoLideranca as "GESTOR" | "COMERCIAL")
    : undefined;
  return {
    id: item.id,
    nome: item.nome,
    cpf: item.cpf,
    email: item.email,
    telefone: "",
    funcao: item.funcao ?? undefined,
    lideranca,
    tipoLideranca: lideranca,
    tipo: item.tipo as "COMERCIAL" | "LIDERANCA" | undefined,
    status: item.status,
    percentualComissao: item.percentualComissao ?? 0,
  };
}