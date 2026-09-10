import { z } from "zod";

function validarCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;
  const calc = (len: number): number => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(d[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
  };
  return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13]);
}

function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number): number => {
    let sum = 0;
    let pos = len + 1;
    for (let i = 0; i < len; i++) {
      sum += parseInt(d[i]) * pos--;
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
  };
  return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10]);
}

export { validarCPF, validarCNPJ };