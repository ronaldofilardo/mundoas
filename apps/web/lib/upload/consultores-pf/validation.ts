import { normalizarSetorNome } from "@asa/shared";
import type { LinhaPlanilha } from "./types";

export function validarLinha(linha: LinhaPlanilha, setoresValidos: string[]): string[] {
  const erros: string[] = [];

  if (!linha.nome || linha.nome.length < 3) {
    erros.push("Nome obrigatório (mínimo 3 caracteres)");
  }

  if (!linha.email) {
    erros.push("Email obrigatório");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(linha.email)) {
    erros.push("Email inválido");
  }

  if (!linha.cpf) {
    erros.push("CPF obrigatório");
  } else {
    const cpfClean = linha.cpf.replace(/\D/g, "");
    if (cpfClean.length < 11) {
      erros.push("CPF deve ter 11 dígitos");
    }
  }

  if (linha.setoresParsed.length === 0) {
    erros.push("Selecione ao menos um setor");
  } else {
    const setoresPermitidos = new Set(setoresValidos.map(normalizarSetorNome));
    const invalidos = linha.setoresParsed.filter(
      (s) => !setoresPermitidos.has(normalizarSetorNome(s)),
    );

    if (invalidos.length > 0) {
      erros.push(`Setor(es) inválido(s): ${invalidos.join(", ")}`);
    }
  }

  return erros;
}
