import { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: "Especialistas em Antecipação de Ativos Judiciais",
  description: "A Agile Intermediação conecta detentores de créditos judiciais e precatórios a liquidez imediata através de tecnologia e análise técnica.",
  openGraph: {
    title: "Agile Intermediação | Antecipação de Ativos",
    description: "Transforme sua espera judicial em liquidez hoje. Análise gratuita em até 48h.",
  }
};

export default function HomePage() {
  return <HomeClient />;
}
