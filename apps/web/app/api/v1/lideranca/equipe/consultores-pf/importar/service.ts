import { hash } from "bcryptjs";
import { normalizarSetorNome } from "@asa/shared";
import { prisma } from "@/lib/db";
import { gerarSenhaProvisoria } from "@/lib/utils";
import { buscarSetoresDaRegraConsultores } from "@/lib/setores-regras";
import {
  extrairLinhasDoArquivo,
  parsePlanilhaLinhas,
} from "@/lib/upload/consultores-pf/parsers";
import { validarLinha } from "@/lib/upload/consultores-pf/validation";
import type {
  LinhaPlanilha,
  ResultadoImportacao,
} from "@/lib/upload/consultores-pf/types";
import type { ImportarConsultorPfContext } from "./types";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 500;

const TIPOS_VALIDOS = [".xlsx", ".xls", ".csv"];

export function validarArquivo(file: File): string | null {
  if (file.size === 0) {
    return "O arquivo enviado está vazio.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Arquivo muito grande. Tamanho máximo permitido: ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
  }
  const nomeArquivo = file.name.toLowerCase();
  const extensaoValida = TIPOS_VALIDOS.some((ext) =>
    nomeArquivo.endsWith(ext),
  );
  if (!extensaoValida) {
    return "Formato inválido. Envie um arquivo .xlsx, .xls ou .csv.";
  }
  return null;
}

export async function carregarLinhas(
  file: File,
): Promise<LinhaPlanilha[]> {
  const linhasBrutas = await extrairLinhasDoArquivo(file);
  return parsePlanilhaLinhas(linhasBrutas);
}

export function limiteExcedido(quantidade: number): boolean {
  return quantidade > MAX_ROWS;
}

function registrarErro(
  resultados: ResultadoImportacao,
  linha: LinhaPlanilha,
  mensagem: string,
): void {
  resultados.erros++;
  resultados.detalhes.push({
    linha: linha.linhaOriginal,
    nome: linha.nome,
    status: "erro",
    mensagem,
  });
}

function registrarSucesso(
  resultados: ResultadoImportacao,
  linha: LinhaPlanilha,
): void {
  resultados.sucesso++;
  resultados.criados++;
  resultados.detalhes.push({
    linha: linha.linhaOriginal,
    nome: linha.nome,
    status: "sucesso",
    mensagem: "Consultor PF criado com sucesso.",
  });
}

async function criarConsultorPf(
  linha: LinhaPlanilha,
  contexto: ImportarConsultorPfContext,
  setoresPorNome: Map<string, { id: string; nome: string }>,
): Promise<void> {
  const emailLower = linha.email.toLowerCase().trim();
  const cpfClean = linha.cpf.replace(/\D/g, "");
  const telefoneClean = linha.telefone.trim() || undefined;

  const senhaTemporaria = gerarSenhaProvisoria(cpfClean);
  const senhaHash = await hash(senhaTemporaria, 12);

  const setoresIds = linha.setoresParsed
    .map((s) => setoresPorNome.get(normalizarSetorNome(s))?.id)
    .filter((id): id is string => Boolean(id));

  await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        nome: linha.nome,
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
        nome: linha.nome,
        cpf: cpfClean,
        liderancaId: contexto.liderancaId,
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
}

async function verificarDuplicidades(
  linha: LinhaPlanilha,
): Promise<string | null> {
  const email = linha.email.toLowerCase().trim();
  const cpf = linha.cpf.replace(/\D/g, "");

  const existingUser = await prisma.usuario.findUnique({
    where: { email },
  });
  if (existingUser) {
    return "Email já cadastrado no sistema.";
  }

  const existingCpf = await prisma.consultorPf.findUnique({
    where: { cpf },
  });
  if (existingCpf) {
    return "CPF já cadastrado como Consultor PF.";
  }

  return null;
}

async function processarLinha(
  linha: LinhaPlanilha,
  contexto: ImportarConsultorPfContext,
  setoresPorNome: Map<string, { id: string; nome: string }>,
  setoresPermitidos: { id: string; nome: string }[],
  resultados: ResultadoImportacao,
): Promise<void> {
  const errosValidacao = validarLinha(
    linha,
    setoresPermitidos.map((s) => s.nome),
  );
  if (errosValidacao.length > 0) {
    registrarErro(resultados, linha, errosValidacao.join(", "));
    return;
  }

  const erroDuplicidade = await verificarDuplicidades(linha);
  if (erroDuplicidade) {
    registrarErro(resultados, linha, erroDuplicidade);
    return;
  }

  try {
    await criarConsultorPf(linha, contexto, setoresPorNome);
    registrarSucesso(resultados, linha);
  } catch (err) {
    console.error(
      `[POST /importar-planilha-consultores-pf] Erro na linha ${linha.linhaOriginal}:`,
      err,
    );
    registrarErro(resultados, linha, "Erro interno ao processar linha.");
  }
}

export async function processarImportacao(
  linhas: LinhaPlanilha[],
  contexto: ImportarConsultorPfContext,
): Promise<ResultadoImportacao> {
  const resultados: ResultadoImportacao = {
    total: linhas.length,
    sucesso: 0,
    erros: 0,
    criados: 0,
    detalhes: [],
  };

  const setoresPermitidos = await buscarSetoresDaRegraConsultores(
    contexto.backofficeId,
  );
  const setoresPorNome = new Map(
    setoresPermitidos.map((s) => [normalizarSetorNome(s.nome), s]),
  );

  for (const linha of linhas) {
    await processarLinha(
      linha,
      contexto,
      setoresPorNome,
      setoresPermitidos,
      resultados,
    );
  }

  return resultados;
}