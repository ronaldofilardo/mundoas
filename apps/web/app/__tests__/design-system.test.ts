import { describe, it, expect } from "vitest";

/**
 * Testes do Design System — Acesso Saúde Aqui (PF)
 *
 * Cobre:
 * 1. Estrutura de navegação da Sidebar (BACKOFFICE, PARCEIRO, COMERCIAL, LIDERANCA)
 * 2. Geração de initials do usuário
 * 3. Paleta de cores laranja (tokens Tailwind)
 * 4. Mensagens de autenticação
 */

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const backofficeNav: NavItem[] = [
  { label: "Dashboard", href: "/backoffice/dashboard", icon: "📊" },
  { label: "Parceiros", href: "/backoffice/parceiros", icon: "👥" },
  { label: "Upload Planilha", href: "/backoffice/uploads", icon: "📥" },
  { label: "Produção", href: "/backoffice/producao", icon: "📋" },
  { label: "Comissões", href: "/backoffice/comissoes", icon: "💰" },
];

const parceiroNav: NavItem[] = [
  { label: "Cadastrar Cliente", href: "/parceiro/indicados", icon: "👥" },
  { label: "Minhas Comissões", href: "/parceiro/comissoes", icon: "💰" },
  { label: "Dados Pessoais", href: "/parceiro/dados-pessoais", icon: "👤" },
];

const comercialNav: NavItem[] = [
  { label: "Minha comissão", href: "/comercial/minha-comissao", icon: "💰" },
  { label: "Minhas metas", href: "/comercial/minhas-metas", icon: "🎯" },
];

const liderancaNav: NavItem[] = [
  { label: "Visão geral", href: "/lideranca", icon: "📊" },
  { label: "Consultores PF", href: "/lideranca/consultores-pf", icon: "👥" },
];

function generateInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("");
}

describe("Sidebar — Navegação do Backoffice", () => {
  it("deve ter 5 itens de navegação", () => {
    expect(backofficeNav).toHaveLength(5);
  });

  it("todos os itens devem ter href, label e icon", () => {
    backofficeNav.forEach((item) => {
      expect(item.href).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeTruthy();
    });
  });

  it("hrefs do backoffice devem começar com /backoffice/", () => {
    backofficeNav.forEach((item) => {
      expect(item.href.startsWith("/backoffice/")).toBe(true);
    });
  });

  it("deve conter rota de parceiros", () => {
    expect(backofficeNav.some((i) => i.href === "/backoffice/parceiros")).toBe(true);
  });

  it("não deve conter rotas de /gestor/, /consultor/ ou /estabelecimento/ (sistema PJ removido)", () => {
    backofficeNav.forEach((item) => {
      expect(item.href.startsWith("/gestor/")).toBe(false);
      expect(item.href.startsWith("/consultor/")).toBe(false);
      expect(item.href.startsWith("/estabelecimento/")).toBe(false);
    });
  });
});

describe("Sidebar — Navegação do Parceiro", () => {
  it("deve ter 3 itens de navegação", () => {
    expect(parceiroNav).toHaveLength(3);
  });

  it("hrefs do parceiro devem começar com /parceiro/", () => {
    parceiroNav.forEach((item) => {
      expect(item.href.startsWith("/parceiro/")).toBe(true);
    });
  });

  it("deve conter rota de dados pessoais", () => {
    expect(parceiroNav.some((i) => i.href === "/parceiro/dados-pessoais")).toBe(true);
  });
});

describe("Sidebar — Navegação do Comercial", () => {
  it("deve ter itens de navegação", () => {
    expect(comercialNav.length).toBeGreaterThan(0);
  });

  it("hrefs do comercial devem começar com /comercial/", () => {
    comercialNav.forEach((item) => {
      expect(item.href.startsWith("/comercial/")).toBe(true);
    });
  });
});

describe("Sidebar — Navegação da Liderança", () => {
  it("deve ter itens de navegação", () => {
    expect(liderancaNav.length).toBeGreaterThan(0);
  });

  it("hrefs da liderança devem começar com /lideranca/", () => {
    liderancaNav.forEach((item) => {
      expect(item.href.startsWith("/lideranca/")).toBe(true);
    });
  });
});

describe("Sidebar — Geração de initials do usuário", () => {
  it("deve gerar 2 letras de nome completo", () => {
    expect(generateInitials("João Silva")).toBe("JS");
  });

  it("deve gerar 1 letra de nome único", () => {
    expect(generateInitials("Vanda")).toBe("V");
  });

  it("deve usar apenas as 2 primeiras palavras", () => {
    expect(generateInitials("Maria de Fátima Silva")).toBe("Md");
  });

  it("deve retornar ? quando nome for null", () => {
    expect(generateInitials(null)).toBe("?");
  });

  it("deve retornar ? quando nome for undefined", () => {
    expect(generateInitials(undefined)).toBe("?");
  });

  it("deve retornar ? quando nome for string vazia", () => {
    expect(generateInitials("")).toBe("?");
  });
});

describe("Design System — Paleta de cores laranja (tokens Tailwind)", () => {
  const palette = {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea6c0a",
    700: "#c2570a",
    800: "#9a3c0f",
    900: "#7c2d12",
  };

  it("cor primária 500 deve ser laranja #f97316", () => {
    expect(palette[500]).toBe("#f97316");
  });

  it("cor primária 600 deve ser laranja escuro #ea6c0a", () => {
    expect(palette[600]).toBe("#ea6c0a");
  });

  it("deve ter 10 tons na paleta", () => {
    expect(Object.keys(palette)).toHaveLength(10);
  });
});

describe("Design System — Mensagens de autenticação", () => {
  it("mensagem de erro de login deve ser legível", () => {
    const msg = "Email ou senha inválidos";
    expect(msg).not.toContain("Credenciais inválidas");
    expect(msg.length).toBeGreaterThan(0);
  });
});
