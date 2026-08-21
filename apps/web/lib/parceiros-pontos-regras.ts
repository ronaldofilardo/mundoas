import type { Prisma } from "@asa/database";

export function obterValorBasePontos(valorTotal: Prisma.Decimal | number | null | undefined): number {
  return Number(valorTotal ?? 0);
}

export function validarValorBasePontos(valor: number): boolean {
  return Number.isFinite(valor) && valor > 0;
}

export function criarEscopoParceiro(backofficeId: string): Prisma.ParceiroWhereInput {
  return { backofficeId };
}

export function criarEscopoPremio(
  premioId: string,
  backofficeId: string | null | undefined,
): Prisma.PremioWhereInput {
  return { id: premioId, backofficeId: backofficeId ?? undefined, ativo: true };
}

export function serializarValorMonetario(valor: Prisma.Decimal | number | null | undefined): string {
  return Number(valor ?? 0).toString();
}
