import { prisma } from "@asa/database";
import { calcularPontosDeProducao, obterCicloVigente } from "../lib/pontos-utils";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

async function main() {
  console.log("🔄 Distribuindo pontos automaticamente para teste...\n");

  // Buscar backoffice
  const backoffice = await prisma.backoffice.findFirst({
    include: {
      ciclosPontos: {
        where: {
          OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
        },
      },
    },
  });

  if (!backoffice) {
    console.log("❌ Nenhum backoffice encontrado");
    return;
  }

  const ciclo = backoffice.ciclosPontos[0];
  console.log(`📅 Ciclo: ${ciclo.nome}`);

  // Buscar procedimentos sem pontos
  const procedimentos = await prisma.procedimentoPF.findMany({
    where: {
      parceiroId: { not: null },
    },
    include: {
      parceiro: { 
        select: { 
          nome: true,
          comercial: { select: { lideranca: { select: { backofficeId: true } } } },
          gestor: { select: { lideranca: { select: { backofficeId: true } } } }
        } 
      },
    },
    orderBy: { dataReferencia: "desc" },
  });

  // Filtrar procedimentos deste backoffice
  const procedimentosDoBackoffice = procedimentos.filter(p => 
    p.parceiro?.comercial?.lideranca?.backofficeId === backoffice.id ||
    p.parceiro?.gestor?.lideranca?.backofficeId === backoffice.id
  );

  let totalDistribuido = 0;
  let totalPontos = 0;

  for (const proc of procedimentosDoBackoffice) {
    // Verificar se já tem pontos
    const existente = await prisma.movimentacaoPontos.findFirst({
      where: {
        referenciaProcedimentoId: proc.id,
        origem: "PRODUCAO_IMPORTADA",
        tipo: "CREDITO",
      },
    });

    if (existente) {
      console.log(`⏭️  ${proc.paciente}: já distribuído`);
      continue;
    }

    // Calcular pontos (usa data de referência ou data de criação)
    const dataRef = proc.dataReferencia || proc.createdAt;
    const pontos = await calcularPontosDeProducao(
      proc.valorComissao,
      dataRef,
      backoffice.id,
    );

    // Criar movimentação. A constraint única do ledger é a proteção final
    // contra duas execuções simultâneas desta rotina.
    try {
      await prisma.movimentacaoPontos.create({
        data: {
          parceiroId: proc.parceiroId!,
          cicloPontosId: ciclo.id,
          tipo: "CREDITO",
          quantidade: pontos,
          descricao: `Pontos por produção: ${proc.procedimento.substring(0, 50)}`,
          referenciaProcedimentoId: proc.id,
          origem: "PRODUCAO_IMPORTADA",
        },
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        console.log(`⏭️  ${proc.paciente}: já distribuído por outra execução`);
        continue;
      }
      throw err;
    }

    console.log(`✅ ${proc.paciente}: ${pontos} pontos (R$ ${proc.valorComissao})`);
    totalDistribuido++;
    totalPontos += pontos;
  }

  console.log(`\n📊 Resumo:`);
  console.log(`   Procedimentos distribuídos: ${totalDistribuido}`);
  console.log(`   Total de pontos: ${totalPontos}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });