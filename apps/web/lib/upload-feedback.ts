export type ResultadoUpload = {
  status: "CONCLUIDO" | "ERRO" | "PROCESSANDO";
  totalRows?: number;
  processedRows?: number;
  duplicatedRows?: number;
  rejectedRows?: number;
  orphanedRows?: number;
  error?: string;
};

export interface UploadFeedback {
  tone: "success" | "warning" | "error";
  title: string;
  message: string;
  details: string[];
}

export function criarFeedbackDuplicidadesPreview(params: {
  duplicadas: number;
  total: number;
  validas: number;
}): UploadFeedback {
  const { duplicadas, total, validas } = params;
  return {
    tone: "warning",
    title: `${duplicadas} produção(ões) já existe(m)`,
    message:
      validas > 0
        ? "Essas linhas serão ignoradas para preservar a produção já cadastrada. As demais linhas novas continuam disponíveis para envio."
        : "Nenhuma linha nova será salva, porque todas as produções identificadas já existem no banco.",
    details: [
      `Linhas analisadas: ${total}.`,
      `Produções repetidas: ${duplicadas}.`,
      `Produções novas disponíveis: ${validas}.`,
      "Nada será apagado do banco.",
    ],
  };
}

const MENSAGEM_GENERICA =
  "Não foi possível concluir o upload. Nenhuma produção foi confirmada.";

/**
 * Remove detalhes internos de Prisma, banco e stack trace das mensagens que
 * chegam ao navegador. O erro original deve continuar somente no log do servidor.
 */
export function mensagemUploadAmigavel(erro: unknown): string {
  const texto = erro instanceof Error ? erro.message : String(erro ?? "");
  const normalizado = texto.toLowerCase();

  if (
    normalizado.includes("prisma") ||
    normalizado.includes("unknown argument") ||
    normalizado.includes("invalid `") ||
    normalizado.includes("connectorerror") ||
    normalizado.includes("prismaclient") ||
    /\bp\d{4}\b/i.test(texto) ||
    normalizado.includes("queryengine") ||
    normalizado.includes("stack")
  ) {
    if (normalizado.includes("duplicatedrows") || normalizado.includes("duplicated_rows")) {
      return "A atualização do controle de duplicidades ainda não foi concluída. Nenhuma produção foi alterada; atualize o sistema e tente novamente.";
    }
    if (normalizado.includes("can't reach database") || normalizado.includes("não foi possível conectar")) {
      return "Não foi possível conectar ao banco de dados. Nenhuma produção foi confirmada; tente novamente em instantes.";
    }
    return MENSAGEM_GENERICA;
  }

  const semPrefixo = texto
    .replace(/^erro ao (processar|fazer) upload:?\s*/i, "")
    .replace(/^erro ao processar planilha:?\s*/i, "")
    .trim();

  if (!semPrefixo || semPrefixo.length > 220 || /[\r\n]/.test(semPrefixo)) {
    return MENSAGEM_GENERICA;
  }

  return semPrefixo;
}

export function criarFeedbackResultado(resultado: ResultadoUpload): UploadFeedback {
  if (resultado.status === "ERRO") {
    return {
      tone: "error",
      title: "Não foi possível concluir o upload",
      message: mensagemUploadAmigavel(resultado.error),
      details: [
        "Nenhuma produção foi confirmada neste envio.",
        "Revise o arquivo e tente novamente.",
      ],
    };
  }

  const processados = resultado.processedRows ?? 0;
  const duplicados = resultado.duplicatedRows ?? 0;
  const rejeitados = resultado.rejectedRows ?? 0;
  const orfaos = resultado.orphanedRows ?? 0;
  const total = resultado.totalRows ?? processados + duplicados + rejeitados + orfaos;

  if (processados === 0 && duplicados > 0) {
    return {
      tone: "warning",
      title: "Nenhuma nova produção foi salva",
      message: `As ${duplicados} produção(ões) já existiam no banco e foram ignoradas para evitar duplicidade.`,
      details: [
        `Linhas analisadas: ${total}.`,
        "Produções novas salvas: 0.",
        "As produções existentes foram preservadas.",
      ],
    };
  }

  const parcial = duplicados > 0 || rejeitados > 0 || orfaos > 0;
  return {
    tone: processados > 0 && parcial ? "warning" : "success",
    title: processados > 0 ? "Upload concluído" : "Upload processado",
    message: processados > 0
      ? `${processados} produção(ões) nova(s) foram salva(s) com sucesso.`
      : "A planilha foi analisada, mas nenhuma produção nova foi salva.",
    details: [
      `Linhas analisadas: ${total}.`,
      `Produções novas salvas: ${processados}.`,
      `Repetidas ignoradas: ${duplicados}.`,
      `Rejeitadas: ${rejeitados}.`,
      `Órfãs: ${orfaos}.`,
    ],
  };
}
