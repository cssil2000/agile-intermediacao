import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agile Intermediação | Antecipação de Créditos e Precatórios",
  description: "Plataforma premium de inteligência jurídico-financeira focada na antecipação de ativos judiciais e precatórios no Brasil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
