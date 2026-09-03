import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@asa/database";
import { requireAdmin, badRequest, created } from "@/lib/api-helpers";
import { gerarSenhaProvisoria } from "@/lib/utils";
import { criarAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const { nome, email, cpf, razaoSocial, cnpj, cep, logradouro, numero, complemento, bairro, cidade, uf, telefone } = body as {
      nome?: string;
      email?: string;
      cpf?: string;
      razaoSocial?: string;
      cnpj?: string;
      cep?: string;
      logradouro?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      cidade?: string;
      uf?: string;
      telefone?: string;
    };

    if (!nome || !email || !cpf) {
      return badRequest("Informe nome, email e CPF da unidade.");
    }

    const cpfClean = cpf.replace(/\D/g, "");
    if (cpfClean.length !== 11) {
      return badRequest("CPF inválido.");
    }

    const emailExiste = await prisma.usuario.findUnique({ where: { email } });
    if (emailExiste) {
      return badRequest("Email já cadastrado no sistema.");
    }

    const cpfExiste = await prisma.backoffice.findUnique({ where: { cpf: cpfClean } });
    if (cpfExiste) {
      return badRequest("CPF já cadastrado como unidade (backoffice).");
    }

    const senhaTemporaria = gerarSenhaProvisoria(cpfClean);
    const senhaHash = await hash(senhaTemporaria, 12);

    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome,
          email,
          senhaHash,
          tipo: "BACKOFFICE",
          papel: "BACKOFFICE",
          senhaTemporaria: true,
        },
      });

      const backoffice = await tx.backoffice.create({
        data: {
          usuarioId: usuario.id,
          nome,
          cpf: cpfClean,
          razaoSocial,
          cnpj,
          logradouro,
          cep,
          numero,
          complemento,
          bairro,
          cidade,
          uf,
          telefone,
        },
      });

      // Onboarding mundoAS: a unidade nasce PENDENTE_TERMOS e só ganha
      // acesso ao dashboard depois de aceitar os 3 documentos jurídicos e
      // ter o primeiro pagamento confirmado pelo Asaas (ver middleware.ts e
      // /api/webhooks/asaas). Antes dessa mudança, a unidade nascia direto
      // em CORTESIA (acesso liberado sem cobrança) — comportamento mantido
      // apenas para quem já usa esse caminho manual em
      // /api/v1/admin/backoffices/[id]/faturas.
      const assinatura = await tx.assinatura.create({
        data: {
          backofficeId: backoffice.id,
          statusAssinatura: "PENDENTE_TERMOS",
        },
      });

      return { usuario, backoffice, assinatura };
    });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "CRIAR_BACKOFFICE",
      entidade: "backoffice",
      entidadeId: result.backoffice.id,
      detalhes: { nome, email, cpf: cpfClean },
    });

    return created({
      id: result.backoffice.id,
      usuarioId: result.usuario.id,
      nome,
      email,
      cpf: cpfClean,
      statusAssinatura: result.assinatura.statusAssinatura,
      senhaTemporaria,
    });
  } catch (err: unknown) {
    console.error("[admin/backoffices] Erro ao criar unidade:", err);
    return badRequest((err instanceof Error ? err.message : "Erro interno ao criar unidade."));
  }
}

export async function GET() {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const backoffices = await prisma.backoffice.findMany({
    include: {
      usuario: { select: { email: true, status: true } },
      assinatura: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(backoffices);
}
