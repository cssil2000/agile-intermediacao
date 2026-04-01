import { Metadata } from 'next';
import PrecatoriosClient from './PrecatoriosClient';

export const metadata: Metadata = {
  title: "Venda de Precatórios Federais e Estaduais",
  description: "Antecipe seu precatório com a Agile Intermediação. Compramos precatórios federais, estaduais e municipais com as melhores taxas do mercado.",
  keywords: ["venda de precatórios", "antecipação de precatórios", "precatório federal", "precatório estadual", "vender precatório"],
  openGraph: {
    title: "Venda de Precatórios | Agile Intermediação",
    description: "Transforme sua espera em liquidez imediata. Análise técnica e segura em 48h.",
  }
};

export default function PrecatoriosPage() {
  return <PrecatoriosClient />;
}
