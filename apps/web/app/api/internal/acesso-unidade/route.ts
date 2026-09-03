import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@asa/database";

// Roda em Node runtime (não Edge) porque usa o Prisma Client.
// Chamada pelo middleware via fetch — ver middleware.ts.
export async function GET(req: NextRequest) {
  const backofficeId = req.nextUrl.searchParams.get("backofficeId");

  if (!backofficeId) {
    return NextResponse.json({ liberado: true }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const assinatura = await prisma.assinatura.findUnique({
    where: { backofficeId },
    select: { statusAssinatura: true, cortesiaExpiraEm: true },
  });

  // Sem assinatura cadastrada: por segurança, libera (evita travar unidades
  // legadas que nasceram antes desse módulo existir). Ajustar se quiser
  // o comportamento inverso.
  if (!assinatura) {
    return NextResponse.json(
      { liberado: true, motivo: "SEM_ASSINATURA" },
      { headers: { "Cache-Control": "public, max-age=30" } },
    );
  }

  // ---------------------------------------------------------------------
  // Onboarding do mundoAS (Plano de Implementação): PENDENTE_TERMOS e
  // PENDENTE_PAGAMENTO não são "bloqueio" no sentido de inadimplência —
  // são etapas do fluxo que o gestor ainda precisa concluir. O middleware
  // usa `etapaOnboarding` para decidir para qual tela redirecionar, em vez
  // de simplesmente barrar o acesso.
  // ---------------------------------------------------------------------
  if (assinatura.statusAssinatura === "PENDENTE_TERMOS") {
    return NextResponse.json(
      { liberado: false, status: assinatura.statusAssinatura, etapaOnboarding: "TERMOS" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (assinatura.statusAssinatura === "PENDENTE_PAGAMENTO") {
    return NextResponse.json(
      { liberado: false, status: assinatura.statusAssinatura, etapaOnboarding: "PAGAMENTO" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  // Cortesia expirada é tratada como se não fosse mais cortesia.
  const cortesiaValida =
    assinatura.statusAssinatura === "CORTESIA" &&
    (!assinatura.cortesiaExpiraEm || new Date(assinatura.cortesiaExpiraEm) > new Date());

  const bloqueado =
    assinatura.statusAssinatura === "BLOQUEADA_MANUAL" ||
    (assinatura.statusAssinatura === "INADIMPLENTE") ||
    (assinatura.statusAssinatura === "CANCELADA") ||
    (assinatura.statusAssinatura === "CORTESIA" && !cortesiaValida && false);
    // ^ nota: cortesia expirada hoje não bloqueia sozinha — ela só deixa de
    // "salvar" quem já estaria INADIMPLENTE. Como não há Asaas ainda, o único
    // caminho real de bloqueio nesta fase é BLOQUEADA_MANUAL ou INADIMPLENTE
    // (setado manualmente ao marcar fatura como não paga/vencida).

  return NextResponse.json(
    {
      liberado: !bloqueado,
      status: assinatura.statusAssinatura,
      motivo: bloqueado ? assinatura.statusAssinatura : undefined,
    },
    { headers: { "Cache-Control": "public, max-age=30" } },
  );
}
