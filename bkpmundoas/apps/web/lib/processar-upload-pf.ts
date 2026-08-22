import { prisma } from "@asa/database";
import { validarCPF } from "@/lib/pontos-utils";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { read, utils } from "xlsx";

const UPLOAD_DIR = join(process.cwd(), "uploads", "backoffice");

function normalizarCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
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
): Promise<void> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Fallback de disco apenas em desenvolvimento (Vercel serverless não suporta).
    if (process.env.NODE_ENV !== "production" && process.env.UPLOAD_PERSIST_DISK !== "false") {
      try {
        if (!existsSync(UPLOAD_DIR)) {
          await mkdir(UPLOAD_DIR, { recursive: true });
        }
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileName = `${timestamp}-${safeName}`;
        await writeFile(join(UPLOAD_DIR, fileName), buffer);
      } catch (err) {
        console.warn("[processarUploadPlanilhaPF] Falha ao gravar em disco (não fatal):", err);
      }
    }

    // Persistir arquivo bruto no banco (fonte de verdade permanente)
    await prisma.uploadPlanilhaBackoffice.update({
      where: { id: uploadId },
      data: {
        conteudoArquivo: buffer,
        tamanhoArquivo: buffer.length,
      },
    });

    // Ler planilha
    const workbook = read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const jsonData: any[][] = utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    if (!jsonData || jsonData.length < 2) {
      throw new Error("Planilha vazia ou sem cabeçalhos");
    }

    // Tornar o re-upload idempotente: remove os procedimentos/linhas brutas
    // já existentes para este backoffice no mesmo mês de referência antes de
    // inserir. O createMany com skipDuplicates NÃO atualiza linhas existentes,
    // então re-envios colidiriam com registros antigos (ex.: valorTotal=0) e
    // permaneceriam zerados na "Lista de Produção".
    try {
      const uploadAtual = await prisma.uploadPlanilhaBackoffice.findUnique({
        where: { id: uploadId },
        select: { mesReferencia: true },
      });
      if (uploadAtual?.mesReferencia) {
        const [ano, mes] = uploadAtual.mesReferencia.split("-");
        const inicioMes = new Date(Number(ano), Number(mes) - 1, 1);
        const fimMes = new Date(Number(ano), Number(mes), 0, 23, 59, 59);
        await prisma.procedimentoPF.deleteMany({
          where: {
            upload: { backofficeId },
            dataReferencia: { gte: inicioMes, lte: fimMes },
          },
        });
        await prisma.procedimentoPFRaw.deleteMany({
          where: {
            upload: { backofficeId, mesReferencia: uploadAtual.mesReferencia },
          },
        });
      }
    } catch (cleanupErr) {
      console.warn(
        "[processarUploadPlanilhaPF] Falha ao limpar registros anteriores do mês (não fatal):",
        cleanupErr,
      );
    }

    const headersRaw = jsonData[1] || [];
    const headers: Record<string, string> = headersRaw.reduce(
      (acc, h, idx) => {
        const headerStr = h ? String(h).trim() : "";
        if (headerStr) {
          acc[String(idx)] = headerStr;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    const normalizar = (s: string) =>
      s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const getColIndex = (nome: string) => {
      const n = normalizar(nome);
      return Object.values(headers).findIndex((h) => normalizar(h) === n);
    };

    const getColIndexFlexible = (nomes: string[]) => {
      for (const nome of nomes) {
        const idx = getColIndex(nome);
        if (idx >= 0) return idx;
      }
      return -1;
    };

    const idxDataRef = getColIndex("Data de Referência");
    const idxPaciente = getColIndex("Paciente");
    const idxCpf = getColIndex("CPF");
    const idxProcedimento = getColIndex("Procedimento");
    const idxUsuarioConta = getColIndex("Usuário da conta");
    const idxUnidade = getColIndex("Unidade");
    const idxTipoProcedimento = getColIndex("Tipo Procedimento");
    const idxFormaPagamento = getColIndex("Forma Pagamento");
    const idxValorTotal = getColIndexFlexible([
      "Total Pago",
      "Total Pagto",
      "Valor Total",
      "Total Pagamento",
      "TotalPago",
    ]);

    // Buscar parceiros do backoffice
    const liderancas = await prisma.equipe.findMany({
      where: { backofficeId, tipo: "LIDERANCA" },
      select: { id: true },
    });
    const liderancaIds = liderancas.map((l) => l.id);

const [comerciais, consultoresPf, gestores] = await Promise.all([
        prisma.equipe.findMany({
          where: { liderancaId: { in: liderancaIds } },
          select: { id: true, nome: true },
        }),
        prisma.consultorPf.findMany({
          where: { liderancaId: { in: liderancaIds }, status: "ATIVO" },
          select: { id: true, nome: true },
        }),
        prisma.gestor.findMany({
          where: { lideranca: { backofficeId } },
          select: { id: true, nome: true },
        }),
      ]);

      const consultorPorNome = new Map(
        consultoresPf.map((c) => [normalizarNome(c.nome), c.id]),
      );

      const comercialPorNome = new Map(
        comerciais.map((c) => [normalizarNome(c.nome), c.id]),
      );

      const gestorPorNome = new Map(
        gestores.map((g) => [normalizarNome(g.nome), g.id]),
      );

    const parceiros = await prisma.parceiro.findMany({
      where: { backofficeId },
      select: {
        id: true,
        nome: true,
        cpf: true,
        comercialId: true,
        gestorId: true,
        indicacoes: {
          select: {
            id: true,
            cpf: true,
          },
        },
      },
    });

    let totalRows = 0;
    let processedRows = 0;
    let rejectedRows = 0;
    let orphanedRows = 0;

    const procedimentosToCreate: any[] = [];
    const linhasRawToCreate: any[] = [];

    for (let i = 2; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || Object.keys(row).length === 0) continue;

      totalRows++;

      const dataReferenciaRaw = row[idxDataRef];
      const paciente = String(row[idxPaciente] || "").trim();
      const cpfRaw = String(row[idxCpf] || "").trim();
      const procedimento = String(row[idxProcedimento] || "").trim();
      const usuarioDaConta = String(row[idxUsuarioConta] || "").trim();
      const unidade =
        idxUnidade >= 0
          ? String(row[idxUnidade] || "").trim()
          : "NÃO INFORMADA";
      const tipoProcedimento =
        idxTipoProcedimento >= 0
          ? String(row[idxTipoProcedimento] || "").trim()
          : "PARTICULAR";
      const formaPagamento =
        idxFormaPagamento >= 0
          ? String(row[idxFormaPagamento] || "").trim()
          : "PARTICULAR";
      const valorTotalRaw =
        idxValorTotal >= 0 ? String(row[idxValorTotal] || "").trim() : "";
      let valorTotal = 0;
      if (valorTotalRaw) {
        const limpo = valorTotalRaw.replace(/[^\d.,-]/g, "");
        if (limpo.includes(",")) {
          valorTotal = parseFloat(limpo.replace(/\./g, "").replace(",", "."));
        } else if (/^\d+\.\d{1,2}$/.test(limpo)) {
          valorTotal = parseFloat(limpo);
        } else {
          valorTotal = parseFloat(limpo.replace(/\./g, ""));
        }
      }

      const dadosOriginais = {
        linha: i + 1,
        dataReferencia: dataReferenciaRaw ?? null,
        paciente,
        cpf: cpfRaw,
        procedimento,
        usuarioDaConta,
        unidade,
        tipoProcedimento,
        formaPagamento,
        valorTotal: valorTotalRaw,
      };

      const cpf = cpfRaw.replace(/\D/g, "");
      const cpfValido = validarCPF(cpf);

      let rejected = false;
      const motivosRejeicao: string[] = [];

      let dataReferencia: Date | null = null;
      if (!dataReferenciaRaw) {
        rejected = true;
        motivosRejeicao.push("data_referencia_ausente");
      } else {
        dataReferencia = parseDate(dataReferenciaRaw);
        if (!dataReferencia) {
          rejected = true;
          motivosRejeicao.push("data_referencia_invalida");
        }
      }

      if (!paciente) {
        rejected = true;
        motivosRejeicao.push("paciente_ausente");
      }
      if (!procedimento) {
        rejected = true;
        motivosRejeicao.push("procedimento_ausente");
      }

      if (rejected) {
        rejectedRows++;
        linhasRawToCreate.push({
          uploadId,
          linhaOriginal: i + 1,
          dadosOriginais,
          valido: false,
          motivoRejeicao: motivosRejeicao.join(","),
          orfao: false,
          motivoOrfao: null,
        });
        continue;
      }

      let parceiroEncontrado = null;
      let indicadoId: string | null = null;
      let consultorPfId: string | null = null;
      let comercialId: string | null = null;
      let gestorIdFromNome: string | null = null;
      let orfao = false;
      const motivosOrfao: string[] = [];

      if (!cpfValido) {
        orfao = true;
        motivosOrfao.push("cpf_invalido_ou_ausente");
      } else {
        parceiroEncontrado = parceiros.find(
          (p) => normalizarCpf(p.cpf) === cpf,
        );

        if (!parceiroEncontrado) {
          for (const parceiro of parceiros) {
            const indicado = parceiro.indicacoes.find(
              (ind) => normalizarCpf(ind.cpf) === cpf,
            );
            if (indicado) {
              parceiroEncontrado = parceiro;
              indicadoId = indicado.id;
              break;
            }
          }
        }

        if (!parceiroEncontrado) {
          orfao = true;
          motivosOrfao.push("parceiro_nao_encontrado");
        }
      }

if (usuarioDaConta) {
          const nomeNormalizado = normalizarNome(usuarioDaConta);
          consultorPfId = consultorPorNome.get(nomeNormalizado) ?? null;
          comercialId = comercialPorNome.get(nomeNormalizado) ?? null;
          gestorIdFromNome = gestorPorNome.get(nomeNormalizado) ?? null;
          if (gestorIdFromNome) {
            // Prioritize gestor from usuario da conta if available
            // We'll assign later when building procedimento record
          }
        }

      const valorComissao = 0;
      const mesReferencia = dataReferencia
        ? `${dataReferencia.getFullYear()}-${String(dataReferencia.getMonth() + 1).padStart(2, "0")}`
        : "";

      // Linha válida (passou nas validações) — sempre grava em raw para auditoria
      linhasRawToCreate.push({
        uploadId,
        linhaOriginal: i + 1,
        dadosOriginais,
        valido: true,
        motivoRejeicao: null,
        orfao,
        motivoOrfao: orfao ? motivosOrfao.join(",") : null,
      });

      if (orfao || !parceiroEncontrado) {
        orphanedRows++;
        continue;
      }

      procedimentosToCreate.push({
        dataReferencia,
        dataPagamento: new Date(),
        formaPagamento,
        paciente,
        procedimento,
        cpf,
        tipoProcedimento,
        unidade,
        indicadoId,
        parceiroId: parceiroEncontrado.id,
        uploadId,
        valorComissao,
        valorTotal,
        comercialId: comercialId ?? parceiroEncontrado.comercialId,
        gestorId: gestorIdFromNome ?? parceiroEncontrado.gestorId,
        consultorPfId,
      });

      processedRows++;
    }

    // Persistir TODAS as linhas em procedimentos_pf_raw (auditoria)
    if (linhasRawToCreate.length > 0) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < linhasRawToCreate.length; i += BATCH_SIZE) {
        const batch = linhasRawToCreate.slice(i, i + BATCH_SIZE);
        await prisma.procedimentoPFRaw.createMany({ data: batch });
      }
    }

    // Persistir apenas procedimentos válidos com parceiro em procedimentos_pf
    if (procedimentosToCreate.length > 0) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < procedimentosToCreate.length; i += BATCH_SIZE) {
        const batch = procedimentosToCreate.slice(i, i + BATCH_SIZE);
        await prisma.procedimentoPF.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
    }

    await prisma.uploadPlanilhaBackoffice.update({
      where: { id: uploadId },
      data: {
        status: "CONCLUIDO",
        totalRows,
        processedRows,
        rejectedRows,
        orphanedRows,
      },
    });
  } catch (error) {
    console.error("[processarUploadPlanilhaPF] Erro:", error);
    await prisma.uploadPlanilhaBackoffice.update({
      where: { id: uploadId },
      data: { status: "ERRO" },
    });
    throw error;
  }
}

function parseDate(dateRaw: any): Date | null {
  if (!dateRaw) return null;

  if (typeof dateRaw === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + dateRaw * 24 * 60 * 60 * 1000);
  }

  const str = String(dateRaw).trim();

  const patterns = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{2})-(\d{2})-(\d{4})$/,
  ];

  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match) {
      if (pattern === patterns[0]) {
        const [, day, month, year] = match;
        return new Date(Number(year), Number(month) - 1, Number(day));
      } else if (pattern === patterns[1]) {
        return new Date(str);
      } else if (pattern === patterns[2]) {
        const [, day, month, year] = match;
        return new Date(Number(year), Number(month) - 1, Number(day));
      }
    }
  }

  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}

function normalizarNome(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
