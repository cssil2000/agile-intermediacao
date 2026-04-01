import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Agile Intermediação | Antecipação de Créditos e Precatórios",
    template: "%s | Agile Intermediação"
  },
  description: "Plataforma premium de inteligência jurídico-financeira focada na antecipação de ativos judiciais e precatórios no Brasil. Liquidez ágil e segura.",
  keywords: ["antecipação de crédito", "precatórios", "causa trabalhista", "ativos judiciais", "investimento jurídico", "agile intermediação"],
  authors: [{ name: "Agile Intermediação" }],
  openGraph: {
    title: "Agile Intermediação | Antecipação de Créditos",
    description: "Transforme sua espera em liquidez imediata. Antecipação de ativos judiciais com inteligência e agilidade.",
    url: "https://agile-intermediacao.vercel.app/",
    siteName: "Agile Intermediação",
    images: [
      {
        url: "https://agile-intermediacao.vercel.app/og-image.png", // Fallback if user adds image later
        width: 1200,
        height: 630,
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agile Intermediação | Antecipação de Créditos",
    description: "Transforme sua espera em liquidez imediata. Antecipação de ativos judiciais com inteligência e agilidade.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
