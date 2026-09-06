import type {
  LinhaBase,
  ParceiroRef,
  PessoaRef,
  ResultadoLinha,
  StatusLinha,
} from "./types";

export function resolverParceiro(
  cpf: string,
  parceiros: ParceiroRef[],
): { parceiro?: ParceiroRef; indicado?: { id: string; cpf: string } } {
  const parceiroEncontrado = parceiros.find((p) => p.cpf.replace(/\D/g, "") === cpf);
  if (parceiroEncontrado) return { parceiro: parceiroEncontrado };

  for (const parceiro of parceiros) {
    const indicado = parceiro.indicacoes.find(
      (ind) => ind.cpf.replace(/\D/g, "") === cpf,
    );
    if (indicado) {
      return { parceiro, indicado };
    }
  }

  return {};
}

export function resolverConsultorPf(
  usuarioDaConta: string,
  consultorPorNome: Map<string, PessoaRef>,
  gestorPorNome: Map<string, PessoaRef>,
): { consultorPf: PessoaRef | null; gestor: PessoaRef | null } {
  if (!usuarioDaConta) return { consultorPf: null, gestor: null };

  const nomeNormalizado = usuarioDaConta
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const consultorPf = consultorPorNome.get(nomeNormalizado) ?? null;
  if (!consultorPf) return { consultorPf: null, gestor: null };

  return { consultorPf, gestor: gestorPorNome.get(nomeNormalizado) ?? null };
}

export function classificarLinha(
  linha: LinhaBase,
  parceiros: ParceiroRef[],
  consultorPorNome: Map<string, PessoaRef>,
  gestorPorNome: Map<string, PessoaRef>,
): ResultadoLinha {
  let status: StatusLinha = "VALIDO";
  let motivo: string | undefined;
  let alerta: string | undefined;

  const { valorTotal, cpf, cpfValido, dataReferencia, paciente, procedimento, usuarioDaConta } =
    linha;

  if (valorTotal === null || !Number.isFinite(valorTotal)) {
    status = "REJEITADO";
    motivo = "Valor total ausente ou inválido";
  }

  if (!linha.dataReferenciaRaw) {
    status = "REJEITADO";
    motivo = "Data de referência ausente";
  } else if (!dataReferencia) {
    status = "REJEITADO";
    motivo = "Data de referência inválida";
  }

  if (!paciente) {
    status = "REJEITADO";
    motivo = motivo ? `${motivo}; Paciente ausente` : "Paciente ausente";
  }

  if (!procedimento) {
    status = "REJEITADO";
    motivo = motivo ? `${motivo}; Procedimento ausente` : "Procedimento ausente";
  }

  let parceiroEncontrado: ParceiroRef | undefined;
  let indicadoEncontrado: { id: string; cpf: string } | undefined;
  let consultorPf: PessoaRef | null = null;
  let gestorEncontrado: PessoaRef | null = null;
  let resgatadoPorConsultorPf = false;

  if (status !== "REJEITADO") {
    if (!cpfValido) {
      status = "ORFAO";
      motivo = !cpf ? "CPF ausente" : "CPF inválido";
    } else {
      const resolvido = resolverParceiro(cpf, parceiros);
      parceiroEncontrado = resolvido.parceiro;
      indicadoEncontrado = resolvido.indicado;

      if (!parceiroEncontrado) {
        status = "ORFAO";
        motivo = "Parceiro não encontrado";
      }
    }

    if (usuarioDaConta && !consultorPf) {
      const resgate = resolverConsultorPf(
        usuarioDaConta,
        consultorPorNome,
        gestorPorNome,
      );
      if (resgate.consultorPf) {
        consultorPf = resgate.consultorPf;
        gestorEncontrado = resgate.gestor;
        if (!parceiroEncontrado && !indicadoEncontrado) {
          resgatadoPorConsultorPf = true;
          if (status === "ORFAO") {
            status = "VALIDO";
            motivo = undefined;
          }
        }
      }
    }
  }

  if (status === "VALIDO" && usuarioDaConta && !consultorPf) {
    alerta =
      "Usuário não localizado como Consultor PF; a produção será importada sem esse vínculo.";
  }

  if (resgatadoPorConsultorPf) {
    alerta =
      "Cliente não indicado, mas vinculado ao Consultor PF da conta. A produção será importada com essa comissão.";
  }

  return {
    status,
    motivo,
    alerta,
    dadosParceiro: {
      parceiroEncontrado,
      indicadoEncontrado,
      consultorPf,
      gestorEncontrado,
      resgatadoPorConsultorPf,
    },
  };
}