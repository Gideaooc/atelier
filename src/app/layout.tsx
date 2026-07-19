import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ProductionDataProvider } from "@/components/providers/production-data-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Fluxo Terceirizado",
    template: "%s | Fluxo Terceirizado",
  },
  description: "Controle de talões, referências, operações e produção terceirizada.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">
        <ProductionDataProvider>{children}</ProductionDataProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
