import { prisma } from "@asa/database";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { processarBonusPfPosUpload } from "@/lib/bonus-pf-pos-upload";

import { normalizarCpf, dataParaChave } from "./helpers";
import { lerPlanilha, NOMES_COLUNA_VALOR_TOTAL } from "./planilha-parser";
import { IndicesColunas } from "./planilha-validator";
import { carregarMapsEquipe, carregarParceiros } from "./parceiro-matcher";
import { processarLinhas } from "./linhas-processor";

const UPLOAD_DIR = join(process.cwd(), "uploads", "backoffice");

export interface BonusPfResultado {
  bonusPfDistribuidos: number;
  bonusPfIgnorados: number;
  bonusPfIgnoradosExistente: number;
  bonusPfErros: number;
}

async function persistirArquivoBruto(uploadId: string, buffer: Buffer): Promise<void> {
  await prisma.uploadPlanilhaBackoffice.update({
    where: { id: uploadId },
    data: {
      conteudoArquivo: buffer,
      tamanhoArquivo: buffer.length,
    },
  });
}

function persistirDiscoDev(nome: string, buffer: Buffer): void {
  if (process.env.NODE_ENV === "production" || process.env.UPLOAD_PERSIST_DISK === "false") {
    return;
  }
  (async () => {
    try {
      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
      }
      const timestamp = Date.now();
      const safeName = nome.replace(/[^a-zA-Z0-9._-]/g, "_");
      await writeFile(join(UPLOAD_DIR, `${timestamp}-${safeName}`), buffer);
    } catch (err) {
      console.warn("[processarUploadPlanilhaPF] Falha ao gravar em disco (não fatal):", err);
    }
  })();
}

async function obterChavesExistentes(
  backofficeId: string,
  mesReferencia: string | null,
): Promise<Set<string>> {
  const chaves = new Set<string>();
  if (!mesReferencia) return chaves;

  const [ano, mes] = mesReferencia.split("-");
  const inicioMes = new Date(Number(ano), Number(mes) - 1, 1);
  const fimMes = new Date(Number(ano), Number(mes), 0, 23, 59, 59);
  const existentes = await prisma.procedimentoPF.findMany({
    where: {
      upload: { backofficeId },
      dataReferencia: { gte: inicioMes, lte: fimMes },
    },
    select: { dataReferencia: true, cpf: true, procedimento: true, unidade: true },
  });
  for (const existente of existentes) {
    chaves.add(
      `${dataParaChave(existente.dataReferencia)}|${normalizarCpf(existente.cpf)}|${existente.procedimento}|${existente.unidade}`,
    );
  }
  return chaves;
}

function resolverIndices(
  getColIndex: (n: string) => number,
  getColIndexFlexible: (n: string[]) => number,
): IndicesColunas {
  const idxValorTotal = getColIndexFlexible(NOMES_COLUNA_VALOR_TOTAL);
  if (idxValorTotal < 0) {
    throw new Error("Coluna financeira obrigatória faltando: Total Pago, Valor Total ou equivalente");
  }

  return {
    idxDataRef: getColIndex("Data de Referência"),
    idxPaciente: getColIndex("Paciente"),
    idxCpf: getColIndex("CPF"),
    idxProcedimento: getColIndex("Procedimento"),
    idxUsuarioConta: getColIndex("Usuário da conta"),
    idxUnidade: getColIndex("Unidade"),
    idxTipoProcedimento: getColIndex("Tipo Procedimento"),
    idxFormaPagamento: getColIndex("Forma Pagamento"),
    idxValorTotal,
  };
}

async function persistirEmBatches<T>(
  rows: T[],
  createMany: (rows: T[]) => Promise<unknown>,
): Promise<void> {
  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await createMany(rows.slice(i, i + BATCH_SIZE));
  }
}

/**
 * Processa upload de planilha PF em background.
 *
 * Persistência:
 *  - Arquivo .xlsx bruto é salvo em uploads_planilha_backoffice.conteudo_arquivo (BYTEA).
 *  - Cada linha da planilha é gravada em procedimentos_pf_raw (auditoria completa),
 *    incluindo válidas, rejeitadas e órfãs, com o motivo.
 *  - Apenas linhas válidas e com parceiro encontrado são gravadas em procedimentos_pf.
 */
export async function processarUploadPlanilhaPF(
  uploadId: string,
  file: File,
  backofficeId: string,
): Promise<BonusPfResultado> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    persistirDiscoDev(file.name, buffer);
    await persistirArquivoBruto(uploadId, buffer);

    const planilha = lerPlanilha(buffer);
    const idxs = resolverIndices(planilha.getColIndex, planilha.getColIndexFlexible);

    const uploadAtual = await prisma.uploadPlanilhaBackoffice.findUnique({
      where: { id: uploadId },
      select: { mesReferencia: true },
    });
    const chavesExistentes = await obterChavesExistentes(
      backofficeId,
      uploadAtual?.mesReferencia ?? null,
    );

    const maps = await carregarMapsEquipe(backofficeId);
    const parceiros = await carregarParceiros(backofficeId);

    const { contadores, procedimentosToCreate, linhasRawToCreate } = processarLinhas({
      uploadId,
      idxs,
      planilha,
      maps,
      parceiros,
      chavesExistentes,
    });

    if (linhasRawToCreate.length > 0) {
      await persistirEmBatches(linhasRawToCreate, (batch) =>
        prisma.procedimentoPFRaw.createMany({ data: batch }),
      );
    }

    if (procedimentosToCreate.length > 0) {
      await persistirEmBatches(procedimentosToCreate, (batch) =>
        prisma.procedimentoPF.createMany({ data: batch, skipDuplicates: true }),
      );
    }

    const bonusPf = await processarBonusPfPosUpload(uploadId, backofficeId);

    await prisma.uploadPlanilhaBackoffice.update({
      where: { id: uploadId },
      data: {
        status: "CONCLUIDO",
        totalRows: contadores.totalRows,
        processedRows: contadores.processedRows,
        duplicatedRows: contadores.duplicatedRows,
        rejectedRows: contadores.rejectedRows,
        orphanedRows: contadores.orphanedRows,
      },
    });

    return bonusPf;
  } catch (error) {
    console.error("[processarUploadPlanilhaPF] Erro:", error);
    await prisma.uploadPlanilhaBackoffice.update({
      where: { id: uploadId },
      data: { status: "ERRO" },
    });
    throw error;
  }
}