import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@asa/database";
import { requireBackofficeWithScope, badRequest, ok } from "@/lib/api-helpers";
import { read, utils } from "xlsx";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return badRequest("Arquivo não enviado");
    }

    const allowedExtensions = [".xlsx", ".xls", ".csv"];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some((ext) =>
      fileName.endsWith(ext),
    );

    if (!hasValidExtension) {
      return badRequest("Formato inválido. Use .xlsx, .xls ou .csv");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    if (!rows.length) {
      return badRequest("Planilha vazia");
    }

    const expectedHeaders = ["Código", "tipo", "Pontuação", "prazo", "descrição"];
    const foundHeaders = Object.keys(rows[0]);

    const normalizedFound = foundHeaders.map((h) => h.trim().toLowerCase());
    const normalizedExpected = expectedHeaders.map((h) => h.trim().toLowerCase());

    const missingHeaders = normalizedExpected.filter(
      (h) => !normalizedFound.includes(h),
    );

    if (missingHeaders.length > 0) {
      return badRequest(
        `Colunas obrigatórias ausentes: ${missingHeaders.join(", ")}`,
      );
    }

    const premios: Array<{
      rowNumber: number;
      codigo: string;
      tipo: string;
      custoPontos: number | null;
      prazoEntregaDias: number | null;
      descricao: string;
      status: "VALIDO" | "REJEITADO";
      motivo?: string;
    }> = [];

    const allowedTypes = ["PRODUTO", "SERVICO", "EXPERIENCIA", "VOUCHER"];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;
      const codigo = String(row["Código"] ?? row["codigo"] ?? "").trim();
      const tipo = String(row["tipo"] ?? row["Tipo"] ?? "").trim().toUpperCase();
      const custoPontosRaw = row["Pontuação"] ?? row["pontuacao"] ?? row["custoPontos"] ?? "";
      const prazoRaw = row["prazo"] ?? row["Prazo"] ?? "";
      const descricao = String(row["descrição"] ?? row["descricao"] ?? "").trim();

      const custoPontos = Number(custoPontosRaw);
      const prazoEntregaDias = Number(prazoRaw);

      if (!codigo) {
        premios.push({
          rowNumber,
          codigo: "",
          tipo: "",
          custoPontos: null,
          prazoEntregaDias: null,
          descricao,
          status: "REJEITADO",
          motivo: "Código é obrigatório",
        });
        continue;
      }

      if (!tipo) {
        premios.push({
          rowNumber,
          codigo,
          tipo: "",
          custoPontos: null,
          prazoEntregaDias: null,
          descricao,
          status: "REJEITADO",
          motivo: "Tipo é obrigatório",
        });
        continue;
      }

      if (!allowedTypes.includes(tipo)) {
        premios.push({
          rowNumber,
          codigo,
          tipo,
          custoPontos: null,
          prazoEntregaDias: null,
          descricao,
          status: "REJEITADO",
          motivo: `Tipo inválido: ${tipo}. Use: ${allowedTypes.join(", ")}`,
        });
        continue;
      }

      if (!Number.isInteger(custoPontos) || custoPontos <= 0) {
        premios.push({
          rowNumber,
          codigo,
          tipo,
          custoPontos: null,
          prazoEntregaDias: null,
          descricao,
          status: "REJEITADO",
          motivo: "Pontuação deve ser um número inteiro positivo",
        });
        continue;
      }

      if (
        !Number.isInteger(prazoEntregaDias) ||
        Number.isNaN(prazoEntregaDias) ||
        prazoEntregaDias < 0
      ) {
        premios.push({
          rowNumber,
          codigo,
          tipo,
          custoPontos,
          prazoEntregaDias: null,
          descricao,
          status: "REJEITADO",
          motivo: "Prazo deve ser um número inteiro não negativo",
        });
        continue;
      }

      if (!descricao) {
        premios.push({
          rowNumber,
          codigo,
          tipo,
          custoPontos,
          prazoEntregaDias,
          descricao: "",
          status: "REJEITADO",
          motivo: "Descrição é obrigatória",
        });
        continue;
      }

      premios.push({
        rowNumber,
        codigo,
        tipo,
        custoPontos,
        prazoEntregaDias,
        descricao,
        status: "VALIDO",
      });
    }

    const validos = premios.filter((p) => p.status === "VALIDO").length;
    const rejeitados = premios.filter((p) => p.status === "REJEITADO").length;

    return ok({
      fileName: file.name,
      previewRows: premios,
      totalRows: premios.length,
      validos,
      rejeitados,
      colunasEncontradas: expectedHeaders,
      colunasObrigatorias: expectedHeaders,
      colunasOpcionais: [],
    });
  } catch (err) {
    console.error("Erro ao processar preview de prêmios:", err);
    return badRequest("Erro ao processar planilha");
  }
}
