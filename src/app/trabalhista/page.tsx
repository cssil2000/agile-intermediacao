import { Metadata } from 'next';
import { Suspense } from 'react';
import TrabalhistaClient from './TrabalhistaClient';

export const metadata: Metadata = {
  title: "Antecipação de Crédito Trabalhista | Receba Agora",
  description: "Antecipe o recebimento dos seus direitos trabalhistas com a Agile Intermediação. Análise rápida, sem burocracia e com total segurança jurídica.",
  keywords: ["antecipação trabalhista", "crédito trabalhista", "receber processo trabalhista", "venda de processo"],
  openGraph: {
    title: "Antecipação de Crédito Trabalhista | Agile",
    description: "Transforme seu processo trabalhista em dinheiro na conta. Avaliação gratuita.",
  }
};

export default function TrabalhistaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <TrabalhistaClient />
    </Suspense>
  );
}
