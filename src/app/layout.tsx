import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/features/auth/hooks/use-auth";
import { ThemeProvider } from "@/features/theme/theme-provider";

export const metadata: Metadata = {
  title: "Controle Financeiro Familiar",
  description: "Controle mensal de receitas, despesas, cartões, faturas e projeções."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
