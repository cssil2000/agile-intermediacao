import { Metadata } from 'next';
import PrecatorioFormClient from './PrecatorioFormClient';

export const metadata: Metadata = {
  title: "Análise de Precatório | Responda e Receba Proposta",
  description: "Preencha os dados do seu precatório para uma análise técnica gratuita. Receba um diagnóstico de liquidez em até 48h com a Agile Intermediação.",
  openGraph: {
    title: "Análise de Precatório Gratuita | Agile",
    description: "Transforme seu precatório em liquidez. Preencha o formulário e receba nossa proposta.",
  }
};

export default function PrecatorioFormPage() {
  return <PrecatorioFormClient />;
}
