import * as XLSX from "xlsx";
import type { LinhaPlanilha } from "./types";

export function normalizarChave(chave: string): string {
  return chave
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export const MAPA_COLUNAS: Record<string, string> = {
  nome: "nome",
  nomecompleto: "nome",
  name: "nome",
  email: "email",
  "e-mail": "email",
  cpf: "cpf",
  telefone: "telefone",
  phone: "telefone",
  telefoneopcional: "telefone",
  setor: "setores",
  setores: "setores",
  sector: "setores",
  sectors: "setores",
};

export function parseSetores(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    return valor
      .flatMap((v) => String(v).split(/[,;|]/))
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  if (typeof valor === "string") {
    return valor
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
}

export function mapearColunas(row: Record<string, unknown>): {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  setoresTexto: string;
  setoresParsed: string[];
} {
  const resultado: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(row)) {
    const chaveNorm = normalizarChave(chave);
    const alvo = MAPA_COLUNAS[chaveNorm];
    if (alvo) {
      resultado[alvo] = valor;
    }
  }

  const setoresTexto = Array.isArray(resultado.setores)
    ? resultado.setores.join(", ")
    : String(resultado.setores || "").trim();

  return {
    nome: String(resultado.nome || "").trim(),
    email: String(resultado.email || "").trim(),
    cpf: String(resultado.cpf || "").trim(),
    telefone: String(resultado.telefone || "").trim(),
    setoresTexto,
    setoresParsed: parseSetores(resultado.setores),
  };
}

export async function extrairLinhasDoArquivo(
  file: File,
): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const nomeArquivo = file.name.toLowerCase();

  if (nomeArquivo.endsWith(".csv") || file.type === "text/csv") {
    const texto = new TextDecoder("utf-8").decode(buffer);
    const linhas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (linhas.length === 0) return [];

    const splitCsv = (linha: string): string[] => {
      const campos: string[] = [];
      let atual = "";
      let dentroAspas = false;
      for (let i = 0; i < linha.length; i++) {
        const ch = linha[i];
        if (ch === '"') {
          if (dentroAspas && linha[i + 1] === '"') {
            atual += '"';
            i++;
          } else {
            dentroAspas = !dentroAspas;
          }
        } else if (ch === "," && !dentroAspas) {
          campos.push(atual);
          atual = "";
        } else {
          atual += ch;
        }
      }
      campos.push(atual);
      return campos.map((c) => c.trim());
    };

    const cabecalho = splitCsv(linhas[0]).map((c) =>
      c.replace(/^"|"$/g, "").trim(),
    );
    return linhas.slice(1).map((linha) => {
      const valores = splitCsv(linha);
      const obj: Record<string, unknown> = {};
      cabecalho.forEach((col, idx) => {
        obj[col] = (valores[idx] || "").replace(/^"|"$/g, "").trim();
      });
      return obj;
    });
  }

  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const primeiraAba = workbook.SheetNames[0];
  if (!primeiraAba) return [];

  const worksheet = workbook.Sheets[primeiraAba];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
    blankrows: false,
  });
}

export function parsePlanilhaLinhas(
  linhasBrutas: Record<string, unknown>[],
): LinhaPlanilha[] {
  return linhasBrutas.map((row, idx) => {
    const mapeado = mapearColunas(row);
    const linha: LinhaPlanilha = {
      linhaOriginal: idx + 2,
      ...mapeado,
      erros: [],
    };
    return linha;
  });
}
