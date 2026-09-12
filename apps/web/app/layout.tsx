import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "mundoAS - Acesso Saúde Aqui",
  description:
    "Plataforma mundoAS - Gestão Inteligente de Saúde, Procedimentos e Fidelização",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Toaster richColors position="top-right" />
        {children}
      </body>
    </html>
  );
}
