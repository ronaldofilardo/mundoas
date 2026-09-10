import type { Procedimento, ResumoProducao } from "../types";

export function calcularResumoProducao(procs: Procedimento[]): ResumoProducao {
  const porMesMap = new Map<string, { qtd: number; comissao: number; valorTotal: number }>();
  const porComercialMap = new Map<string, { nome: string; funcao?: string; qtd: number; comissao: number; valorTotal: number }>();
  const porParceiroMap = new Map<string, { nome: string; qtd: number; comissao: number; valorTotal: number }>();
  const porConsultorPfMap = new Map<string, { nome: string; qtd: number; comissao: number; valorTotal: number }>();

  let totalComissao = 0;
  let totalValorTotal = 0;

  procs.forEach((p) => {
    const mes = p.upload?.mesReferencia || new Date(p.dataReferencia).toISOString().slice(0, 7);
    const comissao = Number(p.valorComissao);
    const valorTotal = Number(p.valorTotal || 0);

    totalComissao += comissao;
    totalValorTotal += valorTotal;

    const mesAtual = porMesMap.get(mes) || { qtd: 0, comissao: 0, valorTotal: 0 };
    mesAtual.qtd += 1;
    mesAtual.comissao += comissao;
    mesAtual.valorTotal += valorTotal;
    porMesMap.set(mes, mesAtual);

    if (p.comercial) {
      const key = p.comercial.id;
      const atual = porComercialMap.get(key) || { nome: p.comercial.nome, funcao: p.comercial.funcao, qtd: 0, comissao: 0, valorTotal: 0 };
      atual.qtd += 1;
      atual.comissao += comissao;
      atual.valorTotal += valorTotal;
      porComercialMap.set(key, atual);
    }

    if (p.parceiro) {
      const key = p.parceiro.id;
      const atual = porParceiroMap.get(key) || { nome: p.parceiro.nome, qtd: 0, comissao: 0, valorTotal: 0 };
      atual.qtd += 1;
      atual.comissao += comissao;
      atual.valorTotal += valorTotal;
      porParceiroMap.set(key, atual);
    }

    if (p.consultorPf) {
      const key = p.consultorPf.id;
      const atual = porConsultorPfMap.get(key) || { nome: p.consultorPf.nome, qtd: 0, comissao: 0, valorTotal: 0 };
      atual.qtd += 1;
      atual.comissao += comissao;
      atual.valorTotal += valorTotal;
      porConsultorPfMap.set(key, atual);
    }
  });

  return {
    totalProcedimentos: procs.length,
    totalComissao,
    totalValorTotal,
    porMes: Array.from(porMesMap.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([mes, dados]) => ({ mes, qtdProcedimentos: dados.qtd, totalComissao: dados.comissao, totalValorTotal: dados.valorTotal })),
    porComercial: Array.from(porComercialMap.entries())
      .map(([comercialId, dados]) => ({
        comercialId,
        comercialNome: dados.nome,
        funcao: dados.funcao,
        qtdProcedimentos: dados.qtd,
        totalComissao: dados.comissao,
        totalValorTotal: dados.valorTotal,
      }))
      .sort((a, b) => b.totalComissao - a.totalComissao),
    porParceiro: Array.from(porParceiroMap.entries())
      .map(([parceiroId, dados]) => ({
        parceiroId,
        parceiroNome: dados.nome,
        qtdProcedimentos: dados.qtd,
        totalComissao: dados.comissao,
        totalValorTotal: dados.valorTotal,
      }))
      .sort((a, b) => b.totalComissao - a.totalComissao),
    porConsultorPf: Array.from(porConsultorPfMap.entries())
      .map(([consultorPfId, dados]) => ({
        consultorPfId,
        consultorPfNome: dados.nome,
        qtdProcedimentos: dados.qtd,
        totalComissao: dados.comissao,
        totalValorTotal: dados.valorTotal,
      }))
      .sort((a, b) => b.totalComissao - a.totalComissao),
  };
}