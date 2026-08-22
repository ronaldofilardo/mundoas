import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { badRequest, ok, requireLiderancaWithScope } from "@/lib/api-helpers";
import { gerarSenhaProvisoria } from "@/lib/utils";

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(req: NextRequest) {
  const { lideranca, error } = await requireLiderancaWithScope();
  if (error) return error;

  let body: JsonObject;
  try {
    const parsed: unknown = await req.json();
    if (!isJsonObject(parsed)) return badRequest("Corpo da requisição inválido.");
    body = parsed;
  } catch {
    return badRequest("Corpo da requisição inválido.");
  }

  const dados = typeof body.dados === "string" ? body.dados : "";
  const modo = body.modo === "atualizar" ? "atualizar" : "criar";

  if (!dados) {
    return badRequest("O campo 'dados' é obrigatório e deve ser uma string.");
  }

  const lines = dados
    .trim()
    .split(/\r?\n/)
    .filter((line: string) => line.trim().length > 0);

  if (lines.length === 0) {
    return badRequest("Nenhuma linha de dados encontrada.");
  }

  const mesesValidos = [
    "janeiro","fevereiro","março","abril","maio","junho",
    "julho","agosto","setembro","outubro","novembro","dezembro",
  ];

  function parseMesReferencia(valor: string): string | null {
    const trim = valor.trim();
    if (/^\d{4}-\d{2}$/.test(trim)) return trim;

    const partes = trim.toLowerCase().split(/\s+/);
    if (partes.length >= 2) {
      const mesNome = partes[0];
      const ano = partes[1];
      const idx = mesesValidos.indexOf(mesNome);
      if (idx >= 0 && /^\d{4}$/.test(ano)) {
        return `${ano}-${String(idx + 1).padStart(2, "0")}`;
      }
    }
    return null;
  }

  const resultados = {
    total: lines.length,
    sucesso: 0,
    erros: 0,
    atualizados: 0,
    criados: 0,
    detalhes: [] as Array<{
      linha: number;
      nome?: string;
      status: "sucesso" | "erro";
      mensagem: string;
      senhaTemporaria?: string;
    }>,
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split("\t").map((p) => p.trim());
    const linhaNumero = i + 1;

    if (parts.length < 3) {
      resultados.erros++;
      resultados.detalhes.push({
        linha: linhaNumero,
        status: "erro",
        mensagem: "Formato esperado: Nome [TAB] Email [TAB] CPF [TAB] Telefone [TAB] Meta [TAB] Mês",
      });
      continue;
    }

    const nome = parts[0];
    const email = parts[1]?.toLowerCase().trim();
    const cpf = parts[2]?.replace(/\D/g, "");
    const telefone = parts[3]?.trim() || undefined;
    const metaStr = parts[4]?.replace(/\D/g, "");
    const mesReferenciaRaw = parts[5]?.trim() || "";

    if (!nome || !email || !cpf) {
      resultados.erros++;
      resultados.detalhes.push({
        linha: linhaNumero,
        nome: nome || "Desconhecido",
        status: "erro",
        mensagem: "Nome, Email e CPF são obrigatórios.",
      });
      continue;
    }

    try {
      const existingUser = await prisma.usuario.findUnique({
        where: { email },
      });

      const existingCpf = await prisma.consultorPf.findUnique({
        where: { cpf },
        include: { usuario: true },
      });

      if (existingUser || existingCpf) {
        if (modo === "criar") {
          resultados.erros++;
          resultados.detalhes.push({
            linha: linhaNumero,
            nome,
            status: "erro",
            mensagem: existingUser
              ? "Email já cadastrado no sistema."
              : "CPF já cadastrado como Consultor PF.",
          });
          continue;
        }

        const targetUsuario = existingUser || existingCpf?.usuario;
        const targetConsultorPf = existingCpf;

        if (!targetUsuario || !targetConsultorPf) {
          resultados.erros++;
          resultados.detalhes.push({
            linha: linhaNumero,
            nome,
            status: "erro",
            mensagem: "Erro ao localizar consultor para atualização.",
          });
          continue;
        }

        if (targetConsultorPf.liderancaId !== lideranca.id) {
          resultados.erros++;
          resultados.detalhes.push({
            linha: linhaNumero,
            nome,
            status: "erro",
            mensagem: "Consultor PF pertence a outra liderança.",
          });
          continue;
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

        resultados.atualizados++;
        resultados.sucesso++;
        resultados.detalhes.push({
          linha: linhaNumero,
          nome,
          status: "sucesso",
          mensagem: "Consultor PF atualizado com sucesso.",
        });
        continue;
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
            liderancaId: lideranca.id,
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

        return { usuario, consultorPf };
      });

      resultados.criados++;
      resultados.sucesso++;
      resultados.detalhes.push({
        linha: linhaNumero,
        nome,
        status: "sucesso",
        mensagem: "Consultor PF criado com sucesso.",
        senhaTemporaria,
      });
    } catch (err) {
      console.error(`[Importar Equipe] Erro na linha ${linhaNumero}:`, err);
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
