import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { gerarSenhaProvisoria } from "@/lib/utils";
import { badRequest, ok } from "@/lib/api-helpers";
import { parseLinhaTSV, parseMesReferencia } from "./parser";

export type ResultadoLinha = {
  linha: number;
  nome?: string;
  status: "sucesso" | "erro";
  mensagem: string;
  senhaTemporaria?: string;
};

export type ResultadosImportacao = {
  total: number;
  sucesso: number;
  erros: number;
  atualizados: number;
  criados: number;
  detalhes: ResultadoLinha[];
};

export interface DadosLinha {
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
  metaStr?: string;
  mesReferenciaRaw?: string;
}

export async function processarLinha(
  line: string,
  liderancaId: string,
  modo: "criar" | "atualizar",
): Promise<ResultadoLinha> {
  const linhaNumero = 1; // will be overridden by caller
  const parseado = parseLinhaTSV(line, linhaNumero);

  if (parseado.erro) {
    return {
      linha: linhaNumero,
      status: "erro",
      mensagem: parseado.erro,
    };
  }

  const { nome, email, cpf, telefone, metaStr, mesReferenciaRaw } = parseado;

  const existingUser = await prisma.usuario.findUnique({
    where: { email },
  });

  const existingCpf = await prisma.consultorPf.findUnique({
    where: { cpf },
    include: { usuario: true },
  });

  if (existingUser || existingCpf) {
    if (modo === "criar") {
      return {
        linha: linhaNumero,
        nome,
        status: "erro",
        mensagem: existingUser
          ? "Email já cadastrado no sistema."
          : "CPF já cadastrado como Consultor PF.",
      };
    }

    const targetUsuario = existingUser || existingCpf?.usuario;
    const targetConsultorPf = existingCpf;

    if (!targetUsuario || !targetConsultorPf) {
      return {
        linha: linhaNumero,
        nome,
        status: "erro",
        mensagem: "Erro ao localizar consultor para atualização.",
      };
    }

    if (targetConsultorPf.liderancaId !== liderancaId) {
      return {
        linha: linhaNumero,
        nome,
        status: "erro",
        mensagem: "Consultor PF pertence a outra liderança.",
      };
    }

    await prisma.usuario.update({
      where: { id: targetUsuario.id },
      data: { nome, telefone: telefone || targetUsuario.telefone },
    });

    await prisma.consultorPf.update({
      where: { id: targetConsultorPf.id },
      data: { nome, status: "ATIVO" },
    });

    if (metaStr && mesReferenciaRaw) {
      const valorMeta = parseFloat(metaStr) / 100;
      const mesRef = parseMesReferencia(mesReferenciaRaw);
      if (mesRef) {
        const existingMeta = await prisma.metaConsultorPf.findFirst({
          where: {
            consultorPfId: targetConsultorPf.id,
            mesReferencia: mesRef,
          },
        });

        if (existingMeta) {
          await prisma.metaConsultorPf.update({
            where: { id: existingMeta.id },
            data: { valorMeta },
          });
        } else {
          await prisma.metaConsultorPf.create({
            data: {
              consultorPfId: targetConsultorPf.id,
              mesReferencia: mesRef,
              valorMeta: valorMeta,
            },
          });
        }
      }
    }

    return {
      linha: linhaNumero,
      nome,
      status: "sucesso",
      mensagem: "Consultor PF atualizado com sucesso.",
    };
  }

  const senhaTemporaria = gerarSenhaProvisoria(cpf);
  const senhaHash = await hash(senhaTemporaria, 12);

  await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        tipo: "CONSULTOR_PF",
        telefone: telefone || undefined,
        senhaTemporaria: true,
      },
    });

    const consultorPf = await tx.consultorPf.create({
      data: {
        usuarioId: usuario.id,
        nome,
        cpf,
        liderancaId,
        status: "ATIVO",
      },
    });

    if (metaStr && mesReferenciaRaw) {
      const valorMeta = parseFloat(metaStr) / 100;
      const mesRef = parseMesReferencia(mesReferenciaRaw);
      if (mesRef) {
        await tx.metaConsultorPf.create({
          data: {
            consultorPfId: consultorPf.id,
            mesReferencia: mesRef,
            valorMeta: valorMeta,
          },
        });
      }
    }
  });

  return {
    linha: linhaNumero,
    nome,
    status: "sucesso",
    mensagem: "Consultor PF criado com sucesso.",
    senhaTemporaria,
  };
}

export async function processarImportacao(
  dadosString: string,
  liderancaId: string,
  modo: "criar" | "atualizar" = "criar",
): Promise<ResultadosImportacao> {
  const lines = dadosString
    .trim()
    .split(/\r?\n/)
    .filter((line: string) => line.trim().length > 0);

  const resultados: ResultadoLinha[] = [];
  let sucesso = 0;
  let erros = 0;
  let atualizados = 0;
  let criados = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const resultado = await processarLinha(line, liderancaId, modo);
    resultado.linha = i + 1;
    resultados.push(resultado);

    if (resultado.status === "sucesso") {
      sucesso++;
      if (resultado.mensagem.includes("atualizado")) atualizados++;
      else criados++;
    } else {
      erros++;
    }
  }

  return {
    total: lines.length,
    sucesso,
    erros,
    atualizados,
    criados,
    detalhes: resultados,
  };
}