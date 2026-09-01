import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { read, utils } from "xlsx";
import {
  badRequest,
  forbidden,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";
import { validarCPF } from "@/lib/pontos-utils";
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

export async function POST(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;
  if (!backofficeId) return forbidden();

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return badRequest("Não foi possível ler o arquivo enviado.");
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return badRequest("Arquivo não enviado. Envie um arquivo .xlsx ou .csv.");
  }

  if (file.size === 0) {
    return badRequest("O arquivo enviado está vazio.");
  }

  if (file.size > MAX_FILE_SIZE) {
    return badRequest(
      `Arquivo muito grande. Tamanho máximo permitido: ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
    );
  }

  const nomeArquivo = file.name.toLowerCase();
  const tiposValidos = [".xlsx", ".xls", ".csv"];
  const extensaoValida = tiposValidos.some((ext) =>
    nomeArquivo.endsWith(ext),
  );
  if (!extensaoValida) {
    return badRequest("Formato inválido. Envie um arquivo .xlsx, .xls ou .csv.");
  }

  let linhasBrutas: Record<string, unknown>[];
  try {
    linhasBrutas = await extrairLinhasDoArquivo(file);
  } catch (err) {
    console.error("[POST /parceiros/upload] Erro ao ler arquivo:", err);
    return badRequest("Não foi possível ler o arquivo. Verifique o formato.");
  }

  if (linhasBrutas.length === 0) {
    return badRequest("Nenhuma linha encontrada no arquivo.");
  }

  if (linhasBrutas.length > MAX_ROWS) {
    return badRequest(
      `Limite de ${MAX_ROWS} linhas por arquivo excedido. Envie o arquivo em partes.`,
    );
  }

  const resultados = {
    total: linhasBrutas.length,
    sucesso: 0,
    erros: 0,
    criados: 0,
    detalhes: [] as Array<{
      linha: number;
      nome?: string;
      status: "sucesso" | "erro";
      mensagem: string;
    }>,
  };

  for (let i = 0; i < linhasBrutas.length; i++) {
    const linhaNumero = i + 2;
    const linhaMapeada = mapearLinha(linhasBrutas[i]);

    const parsed = parceiroUploadSchema.safeParse(linhaMapeada);
    if (!parsed.success) {
      resultados.erros++;
      resultados.detalhes.push({
        linha: linhaNumero,
        nome: linhaMapeada.nome as string | undefined,
        status: "erro",
        mensagem: parsed.error.errors.map((e) => e.message).join(", "),
      });
      continue;
    }

    const { nome, email, cpf } = parsed.data;
    const emailLower = email.toLowerCase().trim();
    const cpfClean = cpf.replace(/\D/g, "");

    if (!validarCPF(cpfClean)) {
      resultados.erros++;
      resultados.detalhes.push({
        linha: linhaNumero,
        nome,
        status: "erro",
        mensagem: "CPF inválido.",
      });
      continue;
    }

    try {
      const existingParceiro = await prisma.parceiro.findFirst({
        where: { cpf: cpfClean },
      });
      if (existingParceiro) {
        resultados.erros++;
        resultados.detalhes.push({
          linha: linhaNumero,
          nome,
          status: "erro",
          mensagem: "CPF já cadastrado como parceiro.",
        });
        continue;
      }

      const existingUser = await prisma.usuario.findUnique({
        where: { email: emailLower },
      });
      if (existingUser) {
        resultados.erros++;
        resultados.detalhes.push({
          linha: linhaNumero,
          nome,
          status: "erro",
          mensagem: "Email já cadastrado no sistema.",
        });
        continue;
      }

      const passwordHash = await hash(cpfClean, 10);

      const usuario = await prisma.usuario.create({
        data: {
          nome,
          email: emailLower,
          senhaHash: passwordHash,
          tipo: "PARCEIRO",
          senhaTemporaria: true,
        },
      });

      const parceiro = await prisma.parceiro.create({
        data: {
          nome,
          cpf: cpfClean,
          usuarioId: usuario.id,
          backofficeId,
          status: "ATIVO",
        },
      });

      await criarAuditLog({
        usuarioId: session.user.id,
        acao: "CRIAR",
        entidade: "PARCEIRO",
        entidadeId: parceiro.id,
        detalhes: { nome, email: emailLower, cpf: cpfClean },
      });

      resultados.criados++;
      resultados.sucesso++;
      resultados.detalhes.push({
        linha: linhaNumero,
        nome,
        status: "sucesso",
        mensagem: "Parceiro criado com sucesso.",
      });
    } catch (err) {
      console.error(
        `[POST /parceiros/upload] Erro na linha ${linhaNumero}:`,
        err,
      );
      resultados.erros++;
      resultados.detalhes.push({
        linha: linhaNumero,
        nome,
        status: "erro",
        mensagem: "Erro interno ao processar linha.",
      });
    }
  }

  return ok(resultados);
}
