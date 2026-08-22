import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import {
  badRequest,
  created,
  ok,
  requireLiderancaWithScope,
} from "@/lib/api-helpers";
import { gerarSenhaProvisoria } from "@/lib/utils";
import { z } from "zod";

const criarConsultorPfSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF deve ter 11 caracteres"),
  telefone: z.string().optional(),
  setores: z
    .array(z.string().min(1))
    .min(1, "Selecione ao menos um setor")
    .max(20, "Limite máximo de setores excedido"),
});

export async function GET() {
  const { lideranca, error } = await requireLiderancaWithScope();
  if (error) return error;

  const consultores = await prisma.consultorPf.findMany({
    where: { liderancaId: lideranca.id },
    include: {
      usuario: {
        select: { id: true, email: true, status: true, telefone: true },
      },
      setores: {
        include: { setor: { select: { id: true, nome: true } } },
        orderBy: { setor: { nome: "asc" } },
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
    })),
  );
}

export async function POST(req: NextRequest) {
  const { lideranca, error } = await requireLiderancaWithScope();
  if (error) {
    console.error("[POST /consultores-pf] Erro na autenticação:", error);
    return error;
  }

  console.log("[POST /consultores-pf] Lideranca:", lideranca.id, lideranca);

  let body: unknown;
  try {
    body = await req.json();
    console.log("[POST /consultores-pf] Body recebido:", body);
  } catch (err: unknown) {
    console.error("[POST /consultores-pf] Erro ao parsear JSON:", err);
    return badRequest("Corpo da requisição inválido.");
  }

  const parsed = criarConsultorPfSchema.safeParse(body);
  if (!parsed.success) {
    console.error("[POST /consultores-pf] Validação falhou:", parsed.error.errors);
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { nome, email, cpf, telefone, setores: setoresNomes } = parsed.data;
  const cpfClean = cpf.replace(/\D/g, "");
  const emailLower = email.toLowerCase().trim();

  console.log("[POST /consultores-pf] Dados validados:", { nome, email: emailLower, cpf: cpfClean });

  const existingUser = await prisma.usuario.findUnique({
    where: { email: emailLower },
  });
  if (existingUser) {
    console.error("[POST /consultores-pf] Email já cadastrado:", emailLower);
    return badRequest("Email já cadastrado no sistema");
  }

  const existingCpf = await prisma.consultorPf.findUnique({
    where: { cpf: cpfClean },
  });
  if (existingCpf) {
    console.error("[POST /consultores-pf] CPF já cadastrado:", cpfClean);
    return badRequest("CPF já cadastrado como Consultor PF");
  }

  const setoresUnicos = Array.from(new Set(setoresNomes.map((s) => s.trim())));
  const setoresEncontrados = await prisma.setor.findMany({
    where: {
      nome: { in: setoresUnicos },
      ativo: true,
    },
    select: { id: true, nome: true },
  });

  if (setoresEncontrados.length !== setoresUnicos.length) {
    const encontrados = new Set(setoresEncontrados.map((s) => s.nome));
    const faltantes = setoresUnicos.filter((n) => !encontrados.has(n));
    console.error("[POST /consultores-pf] Setores inválidos:", faltantes);
    return badRequest(
      `Setor(es) inválido(s) ou inativo(s): ${faltantes.join(", ")}`
    );
  }

  const senhaTemporaria = gerarSenhaProvisoria(cpfClean);
  const senhaHash = await hash(senhaTemporaria, 12);

  console.log("[POST /consultores-pf] Criando usuário e consultor...");

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
    console.log("[POST /consultores-pf] Usuário criado:", usuario.id);

    const consultorPf = await tx.consultorPf.create({
      data: {
        usuarioId: usuario.id,
        nome,
        cpf: cpfClean,
        liderancaId: lideranca.id,
        status: "ATIVO",
      },
    });
    console.log("[POST /consultores-pf] Consultor PF criado:", consultorPf.id);

    await tx.consultorPfSetor.createMany({
      data: setoresEncontrados.map((s) => ({
        consultorPfId: consultorPf.id,
        setorId: s.id,
      })),
    });
    console.log(
      "[POST /consultores-pf] Setores vinculados:",
      setoresEncontrados.map((s) => s.nome).join(", ")
    );

    return { usuario, consultorPf, setores: setoresEncontrados };
  });

  console.log("[POST /consultores-pf] Sucesso!");

  return created({
    id: result.consultorPf.id,
    nome,
    email: emailLower,
    cpf: cpfClean,
    senhaTemporaria,
    setores: result.setores.map((s) => ({ id: s.id, nome: s.nome })),
  });
}
