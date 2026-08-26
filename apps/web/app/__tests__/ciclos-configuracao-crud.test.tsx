// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CriarCicloForm } from "../(dashboard)/backoffice/pontos/components/criar-ciclo-form";
import { CiclosPontos } from "../(dashboard)/backoffice/pontos/components/ciclos-pontos";
import type { CicloPontosItem } from "../(dashboard)/backoffice/pontos/pontos-types";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const ciclo: CicloPontosItem = {
  id: "ciclo-1",
  nome: "Ciclo de Junho",
  inicioAcumuloEm: "2026-06-01T00:00:00.000Z",
  fimAcumuloEm: "2026-06-30T00:00:00.000Z",
  inicioResgateEm: "2026-07-01T00:00:00.000Z",
  fimResgateEm: "2026-07-31T00:00:00.000Z",
  periodicidade: "SEMESTRAL",
  status: "EM_ANDAMENTO",
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal("confirm", vi.fn(() => true));
  vi.stubGlobal("fetch", vi.fn());
});

describe("Configuração de ciclos", () => {
  it("não exibe Periodicidade e exibe o período definido pelas datas", () => {
    render(<CriarCicloForm />);

    expect(screen.queryByLabelText(/Periodicidade/i)).toBeNull();
    expect(screen.getByLabelText("Início")).toBeTruthy();
    expect(screen.getByLabelText("Fim do acúmulo")).toBeTruthy();
    expect(screen.getByLabelText("Fim do resgate")).toBeTruthy();
  });

  it("cria ciclo sem enviar Periodicidade", async () => {
    const onSaved = vi.fn();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: "novo", mensagem: "ok" }), { status: 201 }),
    );
    render(<CriarCicloForm onSaved={onSaved} />);

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ciclo 2026" } });
    fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2026-06-01" } });
    fireEvent.change(screen.getByLabelText("Fim do acúmulo"), { target: { value: "2026-06-30" } });
    fireEvent.change(screen.getByLabelText("Fim do resgate"), { target: { value: "2026-07-31" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar ciclo" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const [, request] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(String(request?.body));
    expect(body).not.toHaveProperty("periodicidade");
    expect(body.inicioAcumuloEm).toContain("2026-06-01");
    expect(body.fimAcumuloEm).toContain("2026-06-30");
  });

  it("preenche o formulário no modo edição e envia PATCH", async () => {
    const onSaved = vi.fn();
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ mensagem: "ok" }), { status: 200 }));
    render(<CriarCicloForm ciclo={ciclo} onSaved={onSaved} />);

    expect(screen.getByDisplayValue("Ciclo de Junho")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Editar ciclo" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ciclo atualizado" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("/api/v1/backoffice/pontos/ciclos/ciclo-1");
    expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBe("PATCH");
  });

  it("deleta o ciclo após confirmação", async () => {
    const reload = vi.fn();
    Object.defineProperty(window, "location", { configurable: true, value: { reload } });
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ mensagem: "Ciclo deletado" }), { status: 200 }));
    render(<CiclosPontos data={[ciclo]} />);

    fireEvent.click(screen.getByRole("button", { name: "Deletar" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      "/api/v1/backoffice/pontos/ciclos/ciclo-1",
      { method: "DELETE" },
    ));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Ciclo de Junho"));
  });
});
