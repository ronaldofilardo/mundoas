import { prisma } from "@asa/database";

/**
 * Valida se CPF já existe na BaseClientesAcessoSaude
 */
export async function cpfExisteEmAcessoSaude(cpf: string): Promise<boolean> {
  const cliente = await prisma.baseClientesAcessoSaude.findUnique({
    where: { cpf },
  });
  return !!cliente;
}

/**
 * Normaliza CPF removendo máscara
 */
export function normalizarCPF(cpf: string): string {
  const cpfLimpo = cpf.replace(/\D/g, "");
  return cpfLimpo.padStart(11, "0");
}

function calcularDigitoVerificador(cpfLimpo: string, inicio: number): number {
  let sum = 0;
  for (let i = 1; i <= inicio; i++) {
    sum += parseInt(cpfLimpo.substring(i - 1, i)) * (inicio + 1 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder;
}

/**
 * Valida CPF
 */
export function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, "");

  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  if (calcularDigitoVerificador(cpfLimpo, 9) !== parseInt(cpfLimpo.substring(9, 10))) {
    return false;
  }

  if (calcularDigitoVerificador(cpfLimpo, 10) !== parseInt(cpfLimpo.substring(10, 11))) {
    return false;
  }

  return true;
}