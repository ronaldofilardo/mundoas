export function formatCpf(cpf: string) {
  if (cpf.length === 11) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return cpf;
}

export function formatBRL(v: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(typeof v === "string" ? parseFloat(v) : v);
}

export function formatarMoeda(valor: string): string {
  const numeros = valor.replace(/\D/g, "");
  const numero = Number(numeros) / 100;
  return numero.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseMoeda(valor: string): string {
  return valor.replace(/\./g, "").replace(",", ".");
}
