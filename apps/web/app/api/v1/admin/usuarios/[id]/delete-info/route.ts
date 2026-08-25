import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    
    if (type === "CONSULTOR") {
      // Check comissões linked to this consultor
      const comissoes = await prisma.consultor.findUnique({
        where: { id: params.id },
        select: {
          usuario: {
            select: {
              cupomConfig: {
                select: { id: true },
              },
            },
          },
        },
      });

      const cupomConfigCount = comissoes?.usuario?.cupomConfig?.length || 0;

      // Check estabelecimentos
      const estabelecimentos = await prisma.estabelecimento.findMany({
        where: { consultorId: params.id },
        select: { id: true },
      });

      return NextResponse.json({
        comissoesCount: cupomConfigCount,
        estabelecimentosCount: estabelecimentos.length,
      });
    } else if (type === "ESTABELECIMENTO") {
      // Check usuarios in this estabelecimento
      const usuarios = await prisma.usuarioEstabelecimento.findMany({
        where: { estabelecimentoId: params.id },
        select: { id: true },
      });

      return NextResponse.json({
        usuariosEstabelecimentoCount: usuarios.length,
        comissoesCount: 0,
        estabelecimentosCount: 0,
      });
    } else if (type === "BACKOFFICE") {
      const backoffice = await prisma.backoffice.findUnique({
        where: { usuarioId: params.id },
        include: { 
          _count: { 
            select: { 
              assinatura: true,
              ciclosPontos: true,
              configuracoesPontos: true,
              equipe: true,
              parceiros: true,
              premios: true,
              regrasComerciais: true,
              regrasFaltas: true,
              regrasGestores: true,
              setores: true,
            } 
          } 
        },
      });
      
      const counts = backoffice?._count || {};
      const totalVinculos = Object.values(counts).reduce((sum: number, v: number) => sum + (v || 0), 0);
      
      return NextResponse.json({ 
        comissoesCount: 0,
        info: {
          assinaturasCount: counts.assinatura || 0,
          ciclosPontosCount: counts.ciclosPontos || 0,
          configuracoesPontosCount: counts.configuracoesPontos || 0,
          equipeCount: counts.equipe || 0,
          parceirosCount: counts.parceiros || 0,
          premiosCount: counts.premios || 0,
          regrasComerciaisCount: counts.regrasComerciais || 0,
          regrasFaltasCount: counts.regrasFaltas || 0,
          regrasGestoresCount: counts.regrasGestores || 0,
          setoresCount: counts.setores || 0,
          totalVinculos,
        }
      });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching delete info:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao buscar informações",
      },
      { status: 500 },
    );
  }
}
