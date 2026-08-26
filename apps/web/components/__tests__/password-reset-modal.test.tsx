// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PasswordResetModal } from "@/components/password-reset-modal";

const { toast } = vi.hoisted(() => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("sonner", () => ({ toast }));
vi.mock("lucide-react", () => ({
  Check: () => <span aria-label="copiado" />,
  Copy: () => <span aria-label="copiar" />,
  Loader2: () => <span aria-label="carregando" />,
}));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <footer>{children}</footer>,
}));
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

describe("PasswordResetModal", () => {
  const fetchMock = vi.fn();
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  function renderModal() {
    return render(
      <PasswordResetModal
        open
        onOpenChange={onOpenChange}
        usuarioId="usuario-1"
        userType="USUARIO"
        userName="Maria Silva"
        apiPath="/api/v1/admin"
      />,
    );
  }

  it("renderiza o nome do usuário e a ação de geração", () => {
    renderModal();

    expect(screen.getByRole("dialog")).toBeTruthy();
expect(screen.getByText("Gere uma senha temporária para Maria Silva")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Gerar senha temporária" })).toBeTruthy();
  });

  it("gera senha temporária com caminho, método e payload corretos", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ temporaryPassword: "Temp-Abc123!" }), { status: 200 }),
    );
    renderModal();

fireEvent.click(screen.getByRole("button", { name: "Gerar senha temporária" }));

    await waitFor(() => expect(screen.getByDisplayValue("Temp-Abc123!")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/admin/usuarios/usuario-1/reset-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ userType: "USUARIO" }),
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Senha temporária gerada com sucesso!");
  });

  it("exibe erro retornado pela API", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "Usuário não encontrado" }), { status: 404 }),
    );
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: "Gerar senha temporária" }));

    expect(await screen.findByText("Usuário não encontrado")).toBeTruthy();
    expect(toast.error).toHaveBeenCalledWith("Usuário não encontrado");
  });

  it("copia a senha temporária e fecha o modal limpando o estado", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ temporaryPassword: "Temp-Zyx987!" }), { status: 200 }),
    );
    renderModal();
fireEvent.click(screen.getByRole("button", { name: "Gerar senha temporária" }));

    const passwordInput = await screen.findByDisplayValue("Temp-Zyx987!");
    expect(passwordInput).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "copiar" }));

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Temp-Zyx987!"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
