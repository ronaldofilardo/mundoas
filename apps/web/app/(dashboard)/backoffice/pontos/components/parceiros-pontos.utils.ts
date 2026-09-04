import * as XLSX from "xlsx";

export interface UploadLinha {
  linha: number;
  nome?: string;
  email?: string;
  cpf?: string;
  erros: string[];
}

export interface ParceiroUploadResultado {
  total: number;
  sucesso: number;
  erros: number;
  criados: number;
  detalhes: Array<{
    linha: number;
    nome?: string;
    status: "sucesso" | "erro";
    mensagem: string;
  }>;
}

export function formatCpf(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizarChaveUpload(chave: string): string {
  return chave
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export const MAPA_COLUNAS_UPLOAD: Record<string, string> = {
  nome: "nome",
  nomecompleto: "nome",
  name: "nome",
  email: "email",
  cpf: "cpf",
};

export function mapearColunasUpload(row: Record<string, unknown>) {
  const resultado: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(row)) {
    const chaveNormalizada = normalizarChaveUpload(chave);
    const alvo = MAPA_COLUNAS_UPLOAD[chaveNormalizada];
    if (alvo) {
      resultado[alvo] = valor;
    }
  }
  return resultado;
}

export function parseCsvUpload(texto: string): Record<string, string>[] {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (linhas.length === 0) return [];

  const splitLinha = (linha: string): string[] => {
    const campos: string[] = [];
    let atual = "";
    let dentroAspas = false;
    for (let i = 0; i < linha.length; i++) {
      const char = linha[i];
      if (char === '"') {
        if (dentroAspas && linha[i + 1] === '"') {
          atual += '"';
          i++;
        } else {
          dentroAspas = !dentroAspas;
        }
      } else if (char === "," && !dentroAspas) {
        campos.push(atual);
        atual = "";
      } else {
        atual += char;
      }
    }
    campos.push(atual);
    return campos.map((c) => c.trim());
  };

  const cabecalho = splitLinha(linhas[0]).map((c) =>
    c.replace(/^"|"$/g, "").trim(),
  );

  return linhas.slice(1).map((linha) => {
    const valores = splitLinha(linha);
    const obj: Record<string, string> = {};
    cabecalho.forEach((col, idx) => {
      obj[col] = (valores[idx] || "").replace(/^"|"$/g, "").trim();
    });
    return obj;
  });
}

export function validarLinhaUpload(
  mapeado: Record<string, unknown>,
  idx: number,
): UploadLinha {
  const nome = String(mapeado.nome || "").trim();
  const email = String(mapeado.email || "").trim();
  const cpf = String(mapeado.cpf || "").trim();
  const erros: string[] = [];

  if (!nome || nome.length < 3) {
    erros.push("Nome obrigatório (mínimo 3 caracteres)");
  }
  if (!email) {
    erros.push("Email obrigatório");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erros.push("Email inválido");
  }
  if (!cpf) {
    erros.push("CPF obrigatório");
  } else if (cpf.replace(/\D/g, "").length < 11) {
    erros.push("CPF deve ter 11 dígitos");
  }

  return {
    linha: idx + 2,
    nome: nome || undefined,
    email: email || undefined,
    cpf: cpf || undefined,
    erros,
  };
}

export async function extrairLinhasUpload(file: File): Promise<UploadLinha[]> {
  const nomeArquivo = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  let linhasBrutas: Record<string, unknown>[];
  if (nomeArquivo.endsWith(".csv") || file.type === "text/csv") {
    const texto = buffer.toString("utf-8");
    linhasBrutas = parseCsvUpload(texto);
  } else {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
    const primeiraAba = workbook.SheetNames[0];
    if (!primeiraAba) return [];
    const worksheet = workbook.Sheets[primeiraAba];
    linhasBrutas = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
      raw: false,
      blankrows: false,
    });
  }

  if (linhasBrutas.length === 0) return [];

  return linhasBrutas.map((row, idx) => validarLinhaUpload(mapearColunasUpload(row), idx));
}
