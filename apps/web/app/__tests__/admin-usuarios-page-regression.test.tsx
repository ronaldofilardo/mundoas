// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup, within } from "@testing-library/react";
import UsuariosPage from "@/app/(dashboard)/admin/usuarios/page";

const { toast } = vi.hoisted(() => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("sonner", () => ({ toast }));
vi.mock("lucide-react", () => ({
  Loader2: () => <span aria-label="carregando" />,
  Key: () => <span aria-label="reset" />,
  Trash2: () => <span aria-label="remover" />,
  Pencil: () => <span aria-label="editar" />,
}));
vi.mock("@/components/password-reset-modal", () => ({
  PasswordResetModal: () => <div role="dialog" aria-label="reset-password-modal" />,
}));
vi.mock("@/components/ui/table", () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
}));
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <footer>{children}</footer>,
}));

function mockResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const gestor = {
  id: "gestor-1",
  nome: "Beta Gestor",
  email: "beta@teste.com",
  cpf: null,
  tipo: "GESTOR",
  status: "ATIVO",
  hierarquia: "GESTOR",
  telefone: "11888888888",
};

const backoffice = {
  id: "backoffice-1",
  nome: "Alpha Backoffice",
  email: "alpha@teste.com",
  cpf: "98765432100",
  tipo: "BACKOFFICE",
  status: "ATIVO",
  hierarquia: "BACKOFFICE",
  telefone: "11777777777",
  razaoSocial: "Alpha Ltda",
  cnpj: "12345678000190",
  percentualComissaoDefault: 5,
  percentualComissaoMax: 100,
};

const payloadLista = { usuarios: [gestor, backoffice] };

describe("Admin Usuarios Page — regressão (listar, editar, excluir)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => mockResponse(payloadLista));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("fluxo listar: carrega e exibe usuários na tabela", async () => {
    render(<UsuariosPage />);

    await waitFor(() => expect(screen.getByText("Beta Gestor")).toBeTruthy());
    expect(screen.getByText("Alpha Backoffice")).toBeTruthy();
    expect(screen.getByText("beta@teste.com")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/usuarios");
  });

  it("fluxo editar: abre o modal de edição ao clicar em Editar", async () => {
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByText("Beta Gestor")).toBeTruthy());

    const editarButtons = screen.getAllByRole("button", { name: /editar/i });
    fireEvent.click(editarButtons[0]);

    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    expect(screen.getByText(/Editar Usuário/i)).toBeTruthy();
  });

  it("fluxo editar: salva alterações via PATCH e atualiza lista", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes("/api/v1/admin/usuarios/gestor-1")) {
        return mockResponse({ success: true });
      }
      return mockResponse(payloadLista);
    });

    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByText("Beta Gestor")).toBeTruthy());

    fireEvent.click(screen.getAllByRole("button", { name: /editar/i })[0]);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());

    const nomeInput = screen.getByDisplayValue("Beta Gestor");
    fireEvent.change(nomeInput, { target: { value: "Beta Gestor Novo" } });

    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/admin/usuarios/gestor-1?type=GESTOR",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    expect(toast.success).toHaveBeenCalledWith("Dados atualizados com sucesso");
  });

  it("fluxo excluir: abre o dialog de confirmação ao clicar em Remover", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes("delete-info")) {
        return mockResponse({ comissoesCount: 0 });
      }
      return mockResponse(payloadLista);
    });

    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByText("Beta Gestor")).toBeTruthy());

    fireEvent.click(screen.getAllByRole("button", { name: /remover/i })[0]);

    await waitFor(() => expect(screen.getByText(/Confirmar exclusão/i)).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/admin/usuarios/gestor-1/delete-info?type=GESTOR",
    );
  });

  it("fluxo excluir: confirma exclusão via DELETE e atualiza lista", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes("delete-info")) {
        return mockResponse({ comissoesCount: 0 });
      }
      if (String(url).includes("/api/v1/admin/usuarios/gestor-1")) {
        return mockResponse({ success: true });
      }
      return mockResponse(payloadLista);
    });

    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByText("Beta Gestor")).toBeTruthy());

    fireEvent.click(screen.getAllByRole("button", { name: /remover/i })[0]);
    await waitFor(() => expect(screen.getByText(/Confirmar exclusão/i)).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: /Remover usuário/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/admin/usuarios/gestor-1?type=GESTOR",
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
    expect(toast.success).toHaveBeenCalledWith("Usuário deletado com sucesso");
  });

  it("exibe aviso de comissões pendentes no dialog de exclusão", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes("delete-info")) {
        return mockResponse({ comissoesCount: 3 });
      }
      return mockResponse(payloadLista);
    });

    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByText("Beta Gestor")).toBeTruthy());

    fireEvent.click(screen.getAllByRole("button", { name: /remover/i })[0]);

    await waitFor(() => expect(screen.getByText(/3 comissão/)).toBeTruthy());
  });
});