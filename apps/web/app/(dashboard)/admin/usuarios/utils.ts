import type { UsuarioForm, UsuarioTipo } from "./types";

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function getTipoColor(tipo: string): string {
  switch (tipo) {
    case "GESTOR":
      return "bg-purple-100 text-purple-800";
    case "CONSULTOR":
      return "bg-blue-100 text-blue-800";
    case "BACKOFFICE":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getStatusColor(status: string): string {
  return status === "ATIVO"
    ? "bg-green-50 text-green-700"
    : "bg-red-50 text-red-700";
}

export function buildBackofficePayload(form: UsuarioForm): Record<string, unknown> {
  return {
    razaoSocial: form.razaoSocial || null,
    cnpj: form.cnpj || null,
    cep: form.cep || null,
    logradouro: form.logradouro || null,
    numero: form.numero || null,
    complemento: form.complemento || null,
    bairro: form.bairro || null,
    cidade: form.cidade || null,
    uf: form.uf || null,
    percentualComissaoDefault: form.percentualComissaoDefault
      ? parseFloat(form.percentualComissaoDefault)
      : undefined,
    percentualComissaoMax: form.percentualComissaoMax
      ? parseFloat(form.percentualComissaoMax)
      : undefined,
  };
}

export function buildEditPayload(form: UsuarioForm, tipo: UsuarioTipo): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    nome: form.nome,
    email: form.email,
    telefone: form.telefone || null,
  };

  if (tipo === "BACKOFFICE") {
    Object.assign(payload, buildBackofficePayload(form));
  }

  return payload;
}