import { NextRequest, NextResponse } from "next/server";
import { requireBackofficeWithScope, badRequest, ok } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const { read, utils } = await import("xlsx");
    const workbook = read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    if (!rows.length) {
      return badRequest("Planilha vazia");
    }

    const allowedTypes = ["PRODUTO", "SERVICO", "EXPERIENCIA", "VOUCHER"];

    let totalRows = 0;
    let processedRows = 0;
    let rejectedRows = 0;

    for (const row of rows) {
      totalRows++;

      const codigo = String(row["Código"] ?? row["codigo"] ?? "").trim();
      const tipo = String(row["tipo"] ?? row["Tipo"] ?? "").trim().toUpperCase();
      const custoPontosRaw = row["Pontuação"] ?? row["pontuacao"] ?? row["custoPontos"] ?? "";
      const prazoRaw = row["prazo"] ?? row["Prazo"] ?? "";
      const descricao = String(row["descrição"] ?? row["descricao"] ?? "").trim();

      const custoPontos = Number(custoPontosRaw);
      const prazoEntregaDias = Number(prazoRaw);

      if (
        !codigo ||
        !tipo ||
        !allowedTypes.includes(tipo) ||
        !Number.isInteger(custoPontos) ||
        custoPontos <= 0 ||
        !Number.isInteger(prazoEntregaDias) ||
        Number.isNaN(prazoEntregaDias) ||
        prazoEntregaDias < 0 ||
        !descricao
      ) {
        rejectedRows++;
        continue;
      }

      const existing = await prisma.premio.findFirst({
        where: { codigo, backofficeId },
      });

      if (existing) {
        await prisma.premio.update({
          where: { id: existing.id },
          data: {
            tipo,
            custoPontos,
            prazoEntregaDias,
            descricao,
            nome: codigo,
            ativo: true,
          },
        });
      } else {
        await prisma.premio.create({
          data: {
            backofficeId,
            codigo,
            tipo,
            custoPontos,
            prazoEntregaDias,
            descricao,
            nome: codigo,
            ativo: true,
          },
        });
      }

      processedRows++;
    }

    return ok({
      status: "CONCLUIDO",
      totalRows,
      processedRows,
      rejectedRows,
      duplicatedRows: 0,
      orphanedRows: 0,
    });
  } catch (err) {
    console.error("Erro ao importar prêmios:", err);
    return badRequest("Erro ao importar prêmios");
  }
}
