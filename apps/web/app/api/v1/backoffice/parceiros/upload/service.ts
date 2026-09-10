import { prisma } from "@asa/database";
import { criarAuditLog } from "@/lib/audit";
import { validarCPF } from "@/lib/pontos-utils";
import { read, utils } from "xlsx";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { hash } from "bcryptjs";
import extrairLinhasDoArquivo, { mapearLinha, parceiroUploadSchema } from "./parser";

export interface UploadResultados {
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

export default async function processarUploadParceiros(
  file: File,
  backofficeId: string,
  session: { user: { id: string; tipo: string } },
): Promise<UploadResultados> {
  let linhasBrutas: Record<string, unknown>[];

  try {
    linhasBrutas = await extrairLinhasDoArquivo(file);
  } catch (err) {
    console.error("[POST /parceiros/upload] Erro ao ler arquivo:", err);
    return {
      total: 0,
      sucesso: 0,
      erros: 0,
      criados: 0,
      detalhes: [{ linha: 0, status: "erro", mensagem: "Não foi possível ler o arquivo. Verifique o formato." }],
    };
  }

  if (linhasBrutas.length === 0) {
    return {
      total: 0,
      sucesso: 0,
      erros: 0,
      criados: 0,
      detalhes: [{ linha: 0, status: "erro", mensagem: "Nenhuma linha encontrada no arquivo." }],
    };
  }

  if (linhasBrutas.length > 500) {
    return {
      total: linhasBrutas.length,
      sucesso: 0,
      erros: 0,
      criados: 0,
      detalhes: [{ linha: 1, status: "erro", mensagem: "Limite de 500 linhas por arquivo excedido. Envie o arquivo em partes." }],
    };
  }

  const resultados: UploadResultados = {
    total: linhasBrutas.length,
    sucesso: 0,
    erros: 0,
    criados: 0,
    detalhes: [] as any[],
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
        mensagem: parsed.error.errors.map((e: any) => e.message).join(", "),
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

      const passwordHash = await new Promise<string>((resolve, reject) => {
        hash(cpfClean, 10, (err, hash) => {
          if (err) reject(err);
          else resolve(hash);
        });
      });

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

  return resultados;
}