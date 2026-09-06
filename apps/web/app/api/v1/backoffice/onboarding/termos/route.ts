import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireBackofficeWithScope, badRequest, notFound, ok } from "@/lib/api-helpers";
import { TERMOS_VERSAO } from "@/lib/legal/mundoas-termos";

// GET: devolve os textos + versão vigente, para a tela renderizar, e o
// estado atual (se já aceitou, quando).
export async function GET() {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const assinatura = await prisma.assinatura.findUnique({
    where: { backofficeId: backofficeId! },
    select: { statusAssinatura: true, termosAceitosEm: true, termosVersao: true },
  });

  return ok({
    versaoVigente: TERMOS_VERSAO,
    statusAssinatura: assinatura?.statusAssinatura ?? null,
    jaAceitou: !!assinatura?.termosAceitosEm && assinatura?.termosVersao === TERMOS_VERSAO,
  });
}

// POST: registra o aceite dos 3 documentos (checkboxes obrigatórios) e
// avança o status da assinatura para PENDENTE_PAGAMENTO — próxima etapa do
// onboarding (Etapa 3: escolha de plano / checkout).
export async function POST(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const { aceiteTermosUso, aceitePrivacidade, aceiteDebitoRecorrente } = body as {
    aceiteTermosUso?: boolean;
    aceitePrivacidade?: boolean;
    aceiteDebitoRecorrente?: boolean;
  };

  if (!aceiteTermosUso || !aceitePrivacidade || !aceiteDebitoRecorrente) {
    return badRequest("É necessário aceitar os 3 documentos (Termos de Uso, Privacidade/LGPD e Autorização de Débito Recorrente).");
  }

  const assinatura = await prisma.assinatura.findUnique({
    where: { backofficeId: backofficeId! },
    select: { id: true, statusAssinatura: true },
  });

  if (!assinatura) {
    return notFound("Assinatura não encontrada para esta unidade.");
  }

  // IP real do gestor no momento do aceite — usado como evidência jurídica
  // do aceite, junto com o timestamp e a versão. Considera o header do
  // proxy/CDN em frente à Vercel (mesma lógica já usada no middleware).
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "desconhecido";

  const atualizada = await prisma.assinatura.update({
    where: { id: assinatura.id },
    data: {
      termosAceitosEm: new Date(),
      termosAceitosIp: ip,
      termosVersao: TERMOS_VERSAO,
      // Só avança o status se ainda estava em PENDENTE_TERMOS — evita
      // "regredir" quem já está ATIVA/CORTESIA e reaceita os termos por
      // algum motivo (ex.: nova versão publicada futuramente).
      statusAssinatura:
        assinatura.statusAssinatura === "PENDENTE_TERMOS"
          ? "PENDENTE_PAGAMENTO"
          : assinatura.statusAssinatura,
    },
    select: { statusAssinatura: true },
  });

  return ok({ ok: true, statusAssinatura: atualizada.statusAssinatura });
}
