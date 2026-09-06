import { describe, expect, it, vi, beforeEach } from "vitest";
import { buscarOuCriarCustomer, criarSubscription, buscarPrimeiraFatura, buscarQrCodePix } from "@/lib/asaas/client";

describe("lib/asaas/client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ASAAS_API_KEY: "test-key", ASAAS_SANDBOX: "true" };
    vi.resetAllMocks();
  });

  describe("buscarOuCriarCustomer", () => {
    it("retorna customer existente quando CPF/CNPJ já cadastrado", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [{ id: "cust-1", name: "Existente", cpfCnpj: "12345678000199" }] }),
      } as never);

      const result = await buscarOuCriarCustomer({
        name: "Novo",
        cpfCnpj: "12345678000199",
        email: "test@test.com",
        externalReference: "bo-1",
      });

      expect(result.id).toBe("cust-1");
    });

    it("cria novo customer quando não existe", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as never)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: "cust-new", name: "Novo", cpfCnpj: "12345678000199" }),
        } as never);

      const result = await buscarOuCriarCustomer({
        name: "Novo",
        cpfCnpj: "12345678000199",
        email: "test@test.com",
        externalReference: "bo-1",
      });

      expect(result.id).toBe("cust-new");
    });

    it("lança erro quando a API retorna status não ok", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errors: [{ description: "CPF inválido" }] }),
      } as never);

      await expect(
        buscarOuCriarCustomer({
          name: "Novo",
          cpfCnpj: "invalido",
          email: "test@test.com",
          externalReference: "bo-1",
        }),
      ).rejects.toThrow("CPF inválido");
    });
  });

  describe("criarSubscription", () => {
    it("cria assinatura com os dados corretos", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "sub-1", status: "ACTIVE" }),
      } as never);

      const result = await criarSubscription({
        customerId: "cust-1",
        billingType: "PIX",
        value: 350,
        cycle: "MONTHLY",
        nextDueDate: "2026-10-15",
        description: "Plano Mensal",
        externalReference: "bo-1",
      });

      expect(result.id).toBe("sub-1");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://sandbox.asaas.com/api/v3/subscriptions",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("\"customer\":\"cust-1\""),
        }),
      );
    });
  });

  describe("buscarPrimeiraFatura", () => {
    it("retorna primeira fatura quando existe", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [{ id: "pay-1", status: "PENDING" }] }),
      } as never);

      const result = await buscarPrimeiraFatura("sub-1");

      expect(result?.id).toBe("pay-1");
    });

    it("retorna null quando não há faturas", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      } as never);

      const result = await buscarPrimeiraFatura("sub-1");

      expect(result).toBeNull();
    });
  });

  describe("buscarQrCodePix", () => {
    it("retorna QR code quando disponível", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ encodedImage: "base64", payload: "pix-payload" }),
      } as never);

      const result = await buscarQrCodePix("pay-1");

      expect(result?.payload).toBe("pix-payload");
    });

    it("retorna null em erro", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("falha"));

      const result = await buscarQrCodePix("pay-1");

      expect(result).toBeNull();
    });
  });
});
