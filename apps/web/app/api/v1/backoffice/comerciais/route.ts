import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  ok,
  requireBackofficeWithScope,
  created,
  forbidden,
} from "@/lib/api-helpers";
import { z } from "zod";

const FUNCOES_COMERCIAIS = [
  "GERENTE_CIRE",
  "SUPERVISOR_ATIVO",
  "SUPERVISOR_RECEPTIVO",
  "SUPERVISOR_FRANQUIA",
  "SUPERVISOR_ATENDIMENTO",
  "GERENTE_ATENDIMENTO",
  "SUPERVISOR_COMERCIAL",
] as const;

const createComercialSchema = z.object({
  nome: z
    .string({ required_error: "O nome é obrigatório" })
    .trim()
    .min(1, "O nome é obrigatório")
    .max(255, "O nome deve ter no máximo 255 caracteres"),
  cpf: z
    .string({ required_error: "O CPF é obrigatório" })
    .trim()
    .regex(/^\d{11}$/, "CPF inválido. Informe 11 dígitos sem pontos ou traços"),
  email: z
    .string({ required_error: "O e-mail é obrigatório" })
    .trim()
    .toLowerCase()
    .email("E-mail inválido"),
  telefone: z
    .string()
    .trim()
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .optional()
    .or(z.literal("")),
  funcao: z
    .enum(FUNCOES_COMERCIAIS, {
      errorMap: () => ({ message: "Função comercial inválida" }),
    })
    .optional(),
  lideranca: z
    .enum(["COMERCIAL", "GESTOR"], {
      errorMap: () => ({ message: "Tipo de liderança inválido" }),
    })
    .optional(),
  tipo: z
    .enum(["GERENTE", "SUPERVISOR", "LIDER"], {
      errorMap: () => ({ message: "Tipo inválido" }),
    })
    .optional(),
  percentualComissao: z
    .number({ invalid_type_error: "Percentual de comissão deve ser um número" })
    .min(0, "Percentual de comissão não pode ser negativo")
    .max(100, "Percentual de comissão não pode ser maior que 100"),
});

export async function GET() {
  console.log("[comerciais GET] Iniciando requisição...");
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  console.log("[comerciais GET] Session:", session?.user?.email, "backofficeId:", backofficeId, "error:", error?.status);
  if (error) return error;

  // Buscar todas as lideranças deste backoffice
  const liderancas = await prisma.lideranca.findMany({
    where: { backofficeId },
    include: {
      comerciais: {
        include: {
          usuario: {
            select: { id: true, email: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      usuario: {
        select: { id: true, email: true, status: true },
      },
    },
  });

  // Buscar comerciais sem liderança (liderancaId = null) pertencentes a este backoffice
  const comerciaisSemLideranca = await prisma.comercial.findMany({
    where: {
      liderancaId: null,
      backofficeId,
    },
    include: {
      usuario: {
        select: { id: true, email: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Planificar todos os comerciais de todas as lideranças
  const comerciaisComLideranca = liderancas.flatMap(l => l.comerciais);

  // Juntar todos os comerciais
  const todosComerciais = [...comerciaisComLideranca, ...comerciaisSemLideranca];

  // Incluir todas as lideranças (COMERCIAL e GESTOR) como "liderança"
  const todasLiderancas = liderancas.map(l => ({
    id: l.id,
    nome: l.nome,
    cpf: l.cpf,
    email: l.usuario.email,
    funcao: l.funcao ?? (l.tipo === "COMERCIAL" ? ("LIDER_COMERCIAL" as const) : ("LIDER_GESTOR" as const)),
    percentualComissao: 0,
    status: l.status,
    createdAt: l.createdAt,
    liderancaId: null,
    tipoLideranca: l.tipo,
    isLideranca: true,
  }));

  return ok([
    ...todosComerciais.map((c) => ({
      id: c.id,
      nome: c.nome,
      cpf: c.cpf,
      email: c.usuario.email,
      funcao: c.funcao,
      percentualComissao: c.percentualComissao,
      status: c.status,
      createdAt: c.createdAt,
      liderancaId: c.liderancaId,
      tipoLideranca: c.tipoLideranca,
      isLideranca: false,
    })),
    ...todasLiderancas,
  ]);
}

export async function POST(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  try {
    const body = await req.json();
    const data = createComercialSchema.parse(body);

    // Verificar se já existe usuário com este email
    const existingUser = await prisma.usuario.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      return badRequest("Já existe um usuário com este email");
    }

    // Verificar se já existe comercial com este CPF
    const existingComercial = await prisma.comercial.findUnique({
      where: { cpf: data.cpf },
    });

    if (existingComercial) {
      return badRequest("Já existe um comercial com este CPF");
    }

    // Se lideranca for informado, criar apenas LIDERANCA (sem Comercial espelhado)
    if (data.lideranca) {
      const existingLideranca = await prisma.lideranca.findUnique({
        where: { cpf: data.cpf },
      });
      if (existingLideranca) {
        return badRequest("Já existe uma liderança com este CPF");
      }

      const usuarioLideranca = await prisma.usuario.create({
        data: {
          nome: data.nome,
          email: data.email.toLowerCase(),
          senhaHash: "",
          tipo: "LIDERANCA",
          telefone: data.telefone,
        },
      });

      const lideranca = await prisma.lideranca.create({
        data: {
          usuarioId: usuarioLideranca.id,
          nome: data.nome,
          cpf: data.cpf,
          backofficeId,
          tipo: data.lideranca,
          funcao: data.funcao,
          status: "ATIVO",
        },
      });

      return created({
        id: lideranca.id,
        nome: lideranca.nome,
        cpf: lideranca.cpf,
        email: usuarioLideranca.email,
        funcao: lideranca.funcao,
        percentualComissao: 0,
        status: lideranca.status,
        lideranca: lideranca.tipo,
        isLideranca: true,
      });
    }

    // Criar usuário para o comercial (não é liderança)
    const usuario = await prisma.usuario.create({
      data: {
        nome: data.nome,
        email: data.email.toLowerCase(),
        senhaHash: "",
        tipo: "COMERCIAL",
        telefone: data.telefone,
      },
    });

    // Criar comercial sem liderança
    const comercial = await prisma.comercial.create({
      data: {
        usuarioId: usuario.id,
        nome: data.nome,
        cpf: data.cpf,
        liderancaId: null,
        backofficeId,
        percentualComissao: data.percentualComissao,
        funcao: data.funcao,
        tipoLideranca: null,
      },
      include: {
        usuario: {
          select: { id: true, email: true, status: true },
        },
      },
    });

    return created({
      id: comercial.id,
      nome: comercial.nome,
      cpf: comercial.cpf,
      email: comercial.usuario.email,
      funcao: comercial.funcao,
      percentualComissao: comercial.percentualComissao,
      status: comercial.status,
      liderancaId: comercial.liderancaId,
      tipoLideranca: comercial.tipoLideranca,
      isLideranca: false,
    });
  } catch (e: any) {
    console.error("[comerciais POST] Erro:", e);

    if (e instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of e.issues) {
        const path = issue.path.join(".") || "form";
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      const firstMessage =
        Object.values(fieldErrors)[0] ?? "Verifique os campos do formulário";
      return badRequest(firstMessage, fieldErrors);
    }

    if (e?.code === "P2002") {
      const target = Array.isArray(e?.meta?.target)
        ? e.meta.target.join(", ")
        : e?.meta?.target ?? "campo";
      const map: Record<string, string> = {
        cpf: "Já existe um cadastro com este CPF",
        email: "Já existe um cadastro com este e-mail",
        usuario_id: "Este usuário já está vinculado a um comercial ou liderança",
      };
      const msg = map[target] ?? `Já existe um cadastro com este ${target}`;
      return badRequest(msg, { field: target });
    }

    if (e?.code === "P2003") {
      return badRequest(
        "Referência inválida. Verifique se a liderança selecionada existe"
      );
    }

    return badRequest(
      "Não foi possível criar o comercial. Tente novamente em alguns instantes"
    );
  }
}


