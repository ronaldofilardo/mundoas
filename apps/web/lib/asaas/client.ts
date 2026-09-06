// Cliente mínimo para a API REST do Asaas (v3). Usa ASAAS_API_KEY e
// ASAAS_SANDBOX (definidos em apps/web/.env.local / .env.production) para
// decidir entre o ambiente de testes e o de produção.
//
// Documentação: https://docs.asaas.com/reference

const BASE_URL =
  process.env.ASAAS_SANDBOX === "true"
    ? "https://sandbox.asaas.com/api/v3"
    : "https://api.asaas.com/v3";

function apiKey(): string {
  const key = process.env.ASAAS_API_KEY;
  if (!key) {
    console.error("[asaas] ASAAS_API_KEY vazio. process.env keys:", Object.keys(process.env).filter(k => k.includes("ASAAS") || k.includes("AUTH") || k.includes("NEXTAUTH")));
    throw new Error("ASAAS_API_KEY não configurada.");
  }
  return key;
}

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const mensagem =
      Array.isArray(data?.errors) && data.errors[0]?.description
        ? data.errors[0].description
        : `Erro ${res.status} ao chamar a API do Asaas.`;
    throw new Error(mensagem);
  }

  return data as T;
}

export type AsaasCustomer = {
  id: string;
  name: string;
  cpfCnpj: string;
  email?: string;
};

export type AsaasSubscription = {
  id: string;
  customer: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  value: number;
  nextDueDate: string;
  cycle: "MONTHLY" | "YEARLY";
};

export type AsaasPayment = {
  id: string;
  subscription?: string;
  status: string;
  value: number;
  dueDate: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixTransaction?: unknown;
};

export type BillingType = "BOLETO" | "PIX" | "CREDIT_CARD" | "UNDEFINED";

// Busca um customer existente pelo CPF/CNPJ (evita duplicar customer a cada
// tentativa de checkout da mesma unidade) ou cria um novo.
export async function buscarOuCriarCustomer(params: {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string | null;
  externalReference: string; // backofficeId — facilita rastrear no painel Asaas
}): Promise<AsaasCustomer> {
  const cpfCnpjLimpo = params.cpfCnpj.replace(/\D/g, "");

  const existentes = await asaasFetch<{ data: AsaasCustomer[] }>(
    `/customers?cpfCnpj=${cpfCnpjLimpo}`,
  );
  if (existentes.data.length > 0) {
    return existentes.data[0];
  }

  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      cpfCnpj: cpfCnpjLimpo,
      email: params.email,
      phone: params.phone || undefined,
      externalReference: params.externalReference,
    }),
  });
}

export async function criarSubscription(params: {
  customerId: string;
  billingType: BillingType;
  value: number;
  cycle: "MONTHLY" | "YEARLY";
  nextDueDate: string; // YYYY-MM-DD
  description: string;
  externalReference: string;
}): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: params.customerId,
      billingType: params.billingType,
      value: params.value,
      cycle: params.cycle,
      nextDueDate: params.nextDueDate,
      description: params.description,
      externalReference: params.externalReference,
    }),
  });
}

// Busca a primeira cobrança gerada para a assinatura, para obter o link de
// pagamento (boleto/invoice) ou os dados do PIX a exibir no checkout.
export async function buscarPrimeiraFatura(subscriptionId: string): Promise<AsaasPayment | null> {
  const result = await asaasFetch<{ data: AsaasPayment[] }>(
    `/payments?subscription=${subscriptionId}&limit=1`,
  );
  return result.data[0] ?? null;
}

export async function buscarQrCodePix(paymentId: string): Promise<{ encodedImage: string; payload: string } | null> {
  try {
    return await asaasFetch(`/payments/${paymentId}/pixQrCode`);
  } catch {
    return null;
  }
}
