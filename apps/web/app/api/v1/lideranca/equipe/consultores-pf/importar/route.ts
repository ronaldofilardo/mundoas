import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { read, utils } from "xlsx";
import {
  badRequest,
  forbidden,
  ok,
  requireLiderancaWithScope,
} from "@/lib/api-helpers";
import { gerarSenhaProvisoria } from "@/lib/utils";
import { buscarSetoresDaRegraConsultores } from "@/lib/setores-regras";
import { z } from "zod";
import { normalizarSetorNome } from "@asa/shared";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 500;
const camposSetorSchema = z
  .union([z.string(), z.array(z.string())])
  .optional();

const linhaSchema = z
  .object({
    nome: z.string().trim().min(3, "Nome deve ter no mínimo 3 caracteres"),
    email: z.string().trim().email("Email inválido"),
    cpf: z.string().trim().min(11, "CPF deve ter no mínimo 11 caracteres"),
    telefone: z.string().trim().optional().nullable(),
    setores: camposSetorSchema,
  })
  .passthrough();

function normalizarChave(chave: string): string {
  return chave
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function mapearLinha(row: Record<string, unknown>): Record<string, unknown> {
  const mapa: Record<string, string> = {
    nome: "nome",
    name: "nome",
    "nome completo": "nome",
    email: "email",
    "e-mail": "email",
    cpf: "cpf",
    telefone: "telefone",
    phone: "telefone",
    "telefone (opcional)": "telefone",
    setor: "setores",
    setores: "setores",
    sector: "setores",
    sectors: "setores",
  };

  const resultado: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(row)) {
    const chaveNormalizada = normalizarChave(chave);
    const alvo = mapa[chaveNormalizada];
    if (alvo) {
      resultado[alvo] = valor;
    }
  }
  return resultado;
}

function parseSetores(valor: unknown): string[] {
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
  if (valor === null || valor === undefined) {
    return [];
  }
  return [String(valor).trim()].filter((s) => s.length > 0);
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
  const { lideranca, backofficeId, error } = await requireLiderancaWithScope();
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
  const extensaoValida = tiposValidos.some((ext) => nomeArquivo.endsWith(ext));
  if (!extensaoValida) {
    return badRequest("Formato inválido. Envie um arquivo .xlsx, .xls ou .csv.");
  }

  let linhasBrutas: Record<string, unknown>[];
  try {
    linhasBrutas = await extrairLinhasDoArquivo(file);
  } catch (err) {
    console.error("[POST /importar-planilha-consultores-pf] Erro ao ler arquivo:", err);
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

  const setoresPermitidos = await buscarSetoresDaRegraConsultores(backofficeId);
  const setoresPorNome = new Map(
      setoresPermitidos.map((s) => [normalizarSetorNome(s.nome), s]),
  );

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

    const parsed = linhaSchema.safeParse(linhaMapeada);
    if (!parsed.success) {
      resultados.erros++;
      resultados.detalhes.push({
        linha: linhaNumero,
        status: "erro",
        mensagem: parsed.error.errors.map((e) => e.message).join(", "),
      });
      continue;
    }

    const { nome, email, cpf, telefone } = parsed.data;
    const emailLower = email.toLowerCase().trim();
    const cpfClean = cpf.replace(/\D/g, "");
    const telefoneClean = telefone?.trim() || undefined;

    const setoresInformados = parseSetores(parsed.data.setores);
    if (setoresInformados.length === 0) {
      resultados.erros++;
      resultados.detalhes.push({
        linha: linhaNumero,
        nome,
        status: "erro",
        mensagem: "Selecione ao menos um setor.",
      });
      continue;
    }

    const setoresUnicos = Array.from(
      new Set(setoresInformados.map((s) => s.trim())),
    );

    const setoresInvalidos = setoresUnicos.filter(
      (s) => !setoresPorNome.has(normalizarSetorNome(s)),
    );

    if (setoresInvalidos.length > 0) {
      const setoresPermitidosTexto = setoresPermitidos.map((setor) => setor.nome).join(", ");
      resultados.erros++;
      resultados.detalhes.push({
        linha: linhaNumero,
        nome,
        status: "erro",
        mensagem: `Setor(es) inválido(s): ${setoresInvalidos.join(
          ", ",
        )}. Permitidos: ${setoresPermitidosTexto || "nenhum setor configurado na regra"}.`,
      });
      continue;
    }

    try {
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

      const existingCpf = await prisma.consultorPf.findUnique({
        where: { cpf: cpfClean },
      });
      if (existingCpf) {
        resultados.erros++;
        resultados.detalhes.push({
          linha: linhaNumero,
          nome,
          status: "erro",
          mensagem: "CPF já cadastrado como Consultor PF.",
        });
        continue;
      }

      const senhaTemporaria = gerarSenhaProvisoria(cpfClean);
      const senhaHash = await hash(senhaTemporaria, 12);

      const setoresIds = setoresUnicos
        .map((s) => setoresPorNome.get(normalizarSetorNome(s))?.id)
        .filter((id): id is string => Boolean(id));

      await prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.create({
          data: {
            nome,
            email: emailLower,
            senhaHash,
            tipo: "CONSULTOR_PF",
            telefone: telefoneClean,
            senhaTemporaria: true,
          },
        });

        const consultorPf = await tx.consultorPf.create({
          data: {
            usuarioId: usuario.id,
            nome,
            cpf: cpfClean,
            liderancaId: lideranca.id,
            status: "ATIVO",
          },
        });

        await tx.consultorPfSetor.createMany({
          data: setoresIds.map((setorId) => ({
            consultorPfId: consultorPf.id,
            setorId,
          })),
        });
      });

      resultados.criados++;
      resultados.sucesso++;
      resultados.detalhes.push({
        linha: linhaNumero,
        nome,
        status: "sucesso",
        mensagem: "Consultor PF criado com sucesso.",
      });
    } catch (err) {
      console.error(
        `[POST /importar-planilha-consultores-pf] Erro na linha ${linhaNumero}:`,
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
