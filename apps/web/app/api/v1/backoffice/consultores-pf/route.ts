import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import {
  badRequest,
  created,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { gerarSenhaProvisoria } from "@/lib/utils";
import { z } from "zod";

const criarConsultorPfSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF deve ter 11 caracteres"),
  telefone: z.string().optional(),
  liderancaId: z.string().uuid("Liderança inválida"),
  setores: z
    .array(z.string().uuid("Setor inválido"))
    .min(1, "Selecione ao menos um setor")
    .max(20, "Limite máximo de setores excedido"),
});

export async function GET(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const liderancaId = req.nextUrl.searchParams.get("liderancaId");

  const where: Record<string, unknown> = {
    lideranca: { backofficeId },
  };

  if (liderancaId) {
    where.liderancaId = liderancaId;
  }

  const consultores = await prisma.consultorPf.findMany({
    where,
    include: {
      usuario: {
        select: { id: true, email: true, status: true, telefone: true },
      },
      setores: {
        include: { setor: { select: { id: true, nome: true } } },
        orderBy: { setor: { nome: "asc" } },
      },
      lideranca: {
        select: { id: true, nome: true },
      },
    },
    orderBy: { criadoEm: "desc" },
  });

  return ok(
    consultores.map((c) => ({
      id: c.id,
      nome: c.nome,
      cpf: c.cpf,
      email: c.usuario.email,
      telefone: c.usuario.telefone,
      status: c.usuario.status,
      createdAt: c.criadoEm,
      setores: c.setores.map((s) => ({ id: s.setor.id, nome: s.setor.nome })),
      lideranca: { id: c.lideranca.id, nome: c.lideranca.nome },
    })),
  );
}

export async function POST(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) {
    console.error("[POST /backoffice/consultores-pf] Erro na autenticação:", error);
    return error;
  }

  let body: unknown;
  try {
    body = await req.json();
    console.log("[POST /backoffice/consultores-pf] Body recebido:", body);
  } catch (err: unknown) {
    console.error("[POST /backoffice/consultores-pf] Erro ao parsear JSON:", err);
    return badRequest("Corpo da requisição inválido.");
  }

  const parsed = criarConsultorPfSchema.safeParse(body);
  if (!parsed.success) {
    console.error("[POST /backoffice/consultores-pf] Validação falhou:", parsed.error.errors);
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { nome, email, cpf, telefone, liderancaId, setores: setorIds } = parsed.data;
  const cpfClean = cpf.replace(/\D/g, "");
  const emailLower = email.toLowerCase().trim();

  console.log("[POST /backoffice/consultores-pf] Dados validados:", { nome, email: emailLower, cpf: cpfClean, liderancaId });

  const existingUser = await prisma.usuario.findUnique({
    where: { email: emailLower },
  });
  if (existingUser) {
    console.error("[POST /backoffice/consultores-pf] Email já cadastrado:", emailLower);
    return badRequest("Email já cadastrado no sistema");
  }

  const existingCpf = await prisma.consultorPf.findUnique({
    where: { cpf: cpfClean },
  });
  if (existingCpf) {
    console.error("[POST /backoffice/consultores-pf] CPF já cadastrado:", cpfClean);
    return badRequest("CPF já cadastrado como Consultor PF");
  }

  const lideranca = await prisma.equipe.findUnique({
    where: { id: liderancaId },
    select: { id: true, backofficeId: true, tipo: true },
  });

  if (!lideranca || lideranca.tipo !== "LIDERANCA" || lideranca.backofficeId !== backofficeId) {
    return badRequest("Liderança inválida ou não pertence a este backoffice");
  }

  const setoresEncontrados = await prisma.setor.findMany({
    where: {
      id: { in: setorIds },
      ativo: true,
      OR: [
        { backofficeId },
        { backofficeId: null },
      ],
    },
    select: { id: true, nome: true },
  });

  if (setoresEncontrados.length !== setorIds.length) {
    const encontrados = new Set(setoresEncontrados.map((s) => s.id));
    const faltantes = setorIds.filter((id) => !encontrados.has(id));
    console.error("[POST /backoffice/consultores-pf] Setores inválidos:", faltantes);
    return badRequest("Setor(es) inválido(s) ou inativo(s)");
  }

  const senhaTemporaria = gerarSenhaProvisoria(cpfClean);
  const senhaHash = await hash(senhaTemporaria, 12);

  console.log("[POST /backoffice/consultores-pf] Criando usuário e consultor...");

  const result = await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        nome,
        email: emailLower,
        senhaHash,
        tipo: "CONSULTOR_PF",
        telefone: telefone || undefined,
        senhaTemporaria: true,
      },
    });
    console.log("[POST /backoffice/consultores-pf] Usuário criado:", usuario.id);

    const consultorPf = await tx.consultorPf.create({
      data: {
        usuarioId: usuario.id,
        nome,
        cpf: cpfClean,
        liderancaId,
        status: "ATIVO",
      },
    });
    console.log("[POST /backoffice/consultores-pf] Consultor PF criado:", consultorPf.id);

    await tx.consultorPfSetor.createMany({
      data: setoresEncontrados.map((s) => ({
        consultorPfId: consultorPf.id,
        setorId: s.id,
      })),
    });
    console.log(
      "[POST /backoffice/consultores-pf] Setores vinculados:",
      setoresEncontrados.map((s) => s.nome).join(", ")
    );

    return { usuario, consultorPf, setores: setoresEncontrados };
  });

  console.log("[POST /backoffice/consultores-pf] Sucesso!");

  return created({
    id: result.consultorPf.id,
    nome,
    email: emailLower,
    cpf: cpfClean,
    senhaTemporaria,
    setores: result.setores.map((s) => ({ id: s.id, nome: s.nome })),
  });
}