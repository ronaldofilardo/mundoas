import { read, utils } from "xlsx";
import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 500;

const parceiroUploadSchema = z.object({
  nome: z.string().trim().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().trim().email("Email inválido"),
  cpf: z.string().trim().min(11, "CPF deve ter no mínimo 11 caracteres"),
});

function normalizarChave(chave: string): string {
  return chave
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

const MAPA_COLUNAS: Record<string, string> = {
  nome: "nome",
  "nome completo": "nome",
  name: "nome",
  email: "email",
  "e-mail": "email",
  cpf: "cpf",
};

function mapearLinha(row: Record<string, unknown>): Record<string, unknown> {
  const resultado: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(row)) {
    const chaveNormalizada = normalizarChave(chave);
    const alvo = MAPA_COLUNAS[chaveNormalizada];
    if (alvo) {
      resultado[alvo] = valor;
    }
  }
  return resultado;
}

function parseCsv(texto: string): Record<string, string>[] {
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

async function extrairLinhasDoArquivo(
  file: File,
): Promise<Record<string, unknown>[]> {
  const nomeArquivo = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (nomeArquivo.endsWith(".csv") || file.type === "text/csv") {
    const texto = buffer.toString("utf-8");
    return parseCsv(texto);
  }

  const workbook = read(buffer, { type: "buffer", cellDates: false });
  const primeiraAba = workbook.SheetNames[0];
  if (!primeiraAba) return [];

  const worksheet = workbook.Sheets[primeiraAba];
  const matriz = utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
    blankrows: false,
  });

  return matriz;
}

export { mapearLinha, normalizarChave, MAPA_COLUNAS, parceiroUploadSchema };
export type { Record as SheetRecord };
export default extrairLinhasDoArquivo;