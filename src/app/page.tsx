'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  BarChart3, 
  Gavel, 
  Scale, 
  CheckCircle2, 
  Clock,
  ExternalLink
} from 'lucide-react';

export default function HomePage() {
  useEffect(() => {
    // Basic reveal effect on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="homepage">
      <Header />
      
      <main>
        {/* HERO SECTION */}
        <section className="hero">
          <div className="container">
            <div className="hero-content reveal">
              <span className="badge-premium">INTELIGÊNCIA JURÍDICO-FINANCEIRA</span>
              <h1 className="hero-title">
                Sua ponte estratégica para a <span className="gold">antecipação de ativos</span> no Brasil.
              </h1>
              <p className="hero-subtitle">
                Especialistas em liquidez para ativos judiciais. Oferecemos análise técnica sofisticada e antecipação ágil para quem não quer esperar o tempo da justiça.
              </p>
              <div className="hero-ctas">
                <a href="#solucoes" className="btn btn-primary">Conhecer Soluções <ArrowRight size={18} /></a>
                <Link href="/admin/dashboard" className="btn btn-outline">Área do Cliente</Link>
              </div>
            </div>
          </div>
        </section>

        {/* SOLUTIONS SECTION - NEW CARDS */}
        <section id="solucoes" className="section solutions">
          <div className="container">
            <div className="section-header reveal text-center">
              <span className="uppercase text-gold">Nossas Frentes</span>
              <h2 className="section-title">Soluções Adaptadas ao seu Tipo de Ativo</h2>
              <div className="divider"></div>
            </div>

            <div className="solutions-grid">
              {/* CARD 1: TRABALHISTA */}
              <div className="solution-card reveal">
                <div className="card-icon">
                  <Gavel size={32} className="gold" />
                </div>
                <h3>Crédito Trabalhista</h3>
                <p>
                  Ideal para trabalhadores ou advogados que possuem processos em fase final e desejam antecipar o recebimento dos seus direitos sem aguardar as filas de pagamento.
                </p>
                <div className="card-features">
                  <div className="feature-item"><CheckCircle2 size={16} /> Análise em 48h</div>
                  <div className="feature-item"><CheckCircle2 size={16} /> Sem burocracia excessiva</div>
                  <div className="feature-item"><CheckCircle2 size={16} /> Foco em causas de alto valor</div>
                </div>
                <Link href="/trabalhista" className="btn btn-card">
                  Antecipar Trabalhista <ArrowRight size={16} />
                </Link>
              </div>

              {/* CARD 2: PRECATÓRIOS - NEW */}
              <div className="solution-card featured reveal">
                <div className="card-icon">
                  <Shield size={32} className="gold" />
                </div>
                <div className="card-tag">NOVIDADE</div>
                <h3>Precatórios</h3>
                <p>
                  Antecipação e negociação de créditos contra o Poder Público (União, Estados e Municípios). Liquidez imediata para sua fila de espera governamental.
                </p>
                <div className="card-features">
                  <div className="feature-item"><CheckCircle2 size={16} /> Natureza Alimentar ou Comum</div>
                  <div className="feature-item"><CheckCircle2 size={16} /> Estaduais, Federais e Municipais</div>
                  <div className="feature-item"><CheckCircle2 size={16} /> Compra total ou parcial</div>
                </div>
                <Link href="/precatorios" className="btn btn-primary btn-full">
                  Negociar Precatório <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* WHY AGILE */}
        <section id="beneficios" className="section bg-surface">
          <div className="container">
            <div className="grid-2">
              <div className="reveal">
                <span className="uppercase text-gold">Por que escolher a Agile?</span>
                <h2 className="section-title">Tecnologia e Segurança no Mercado de Ativos</h2>
                <div className="divider" style={{ margin: '1.5rem 0' }}></div>
                <p className="text-muted mb-1">
                  Não somos apenas intermediários. Somos uma operação estruturada com tecnologia própria de triagem para garantir a melhor proposta tanto para o detentor do crédito quanto para o investidor.
                </p>
                
                <div className="trust-items">
                  <div className="trust-item">
                    <div className="trust-icon"><Zap size={20} /></div>
                    <div>
                      <h4 className="gold">Agilidade Real</h4>
                      <p>Nossa tecnologia reduz o tempo de análise de semanas para poucos dias.</p>
                    </div>
                  </div>
                  <div className="trust-item">
                    <div className="trust-icon"><Shield size={20} /></div>
                    <div>
                      <h4 className="gold">Segurança Jurídica</h4>
                      <p>Todo o processo é formalizado e acompanhado por especialistas jurídicos.</p>
                    </div>
                  </div>
                  <div className="trust-item">
                    <div className="trust-icon"><BarChart3 size={20} /></div>
                    <div>
                      <h4 className="gold">Análise Inteligente</h4>
                      <p>Avaliamos a solvência e o risco com precisão, oferecendo propostas justas.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="reveal">
                <div className="image-placeholder">
                   <div className="glass-box">
                      <div className="glass-content">
                        <Scale size={48} className="gold" />
                        <h3>Excelência em Ativos Judiciais</h3>
                        <p>Agile Intermediação</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="section">
          <div className="container">
            <div className="cta-banner reveal text-center">
              <h2 className="banner-title">Pronto para antecipar seus direitos?</h2>
              <p className="banner-subtitle">Inicie sua análise gratuita agora mesmo e receba uma proposta em até 48 horas.</p>
              <div className="hero-ctas mt-2">
                <Link href="/trabalhista" className="btn btn-primary">Crédito Trabalhista</Link>
                <Link href="/precatorios" className="btn btn-outline">Precatórios</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .homepage {
          overflow-x: hidden;
        }

        .hero {
          padding: 10rem 0 6rem;
          min-height: 90vh;
          display: flex;
          align-items: center;
          background: radial-gradient(circle at top right, rgba(194, 161, 95, 0.1), transparent 40%),
                      radial-gradient(circle at bottom left, rgba(0, 43, 54, 0.3), transparent 50%);
        }

        .hero-content {
          text-align: center;
          max-width: 900px;
          margin: 0 auto;
        }

        .badge-premium {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 2px;
          padding: 0.5rem 1rem;
          background: rgba(194, 161, 95, 0.1);
          border: 1px solid rgba(194, 161, 95, 0.3);
          border-radius: 9999px;
          color: var(--color-gold);
          margin-bottom: 2rem;
        }

        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-family: var(--font-heading);
          line-height: 1.1;
          margin-bottom: 1.5rem;
        }

        .hero-subtitle {
          font-size: 1.2rem;
          color: var(--text-muted);
          max-width: 650px;
          margin: 0 auto 3rem;
          line-height: 1.6;
        }

        .hero-ctas {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
        }

        .section {
          padding: 8rem 0;
        }

        .section-header {
          margin-bottom: 4rem;
        }

        .section-title {
          font-size: 2.5rem;
          margin: 1rem 0;
          font-family: var(--font-heading);
        }

        .divider {
          width: 80px;
          height: 4px;
          background: var(--color-gold);
          margin: 0 auto;
          border-radius: 2px;
        }

        /* Solutions Grid */
        .solutions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2.5rem;
        }

        .solution-card {
          padding: 3rem 2rem;
          background: #121d26;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          position: relative;
          transition: all 0.4s ease;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .solution-card:hover {
          transform: translateY(-10px);
          border-color: rgba(194, 161, 95, 0.4);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .solution-card.featured {
          background: linear-gradient(135deg, #121d26, #002B36);
          border: 1px solid rgba(194, 161, 95, 0.3);
        }

        .card-tag {
          position: absolute;
          top: 2rem;
          right: 2rem;
          background: var(--color-gold);
          color: #000;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 4px;
          letter-spacing: 1px;
        }

        .card-icon {
          margin-bottom: 2rem;
        }

        .solution-card h3 {
          font-family: var(--font-heading);
          font-size: 1.8rem;
          margin-bottom: 1rem;
        }

        .solution-card p {
          color: var(--text-muted);
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
          flex: 1;
        }

        .card-features {
          margin-bottom: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .feature-item :global(svg) {
          color: var(--color-gold);
        }

        .btn-card {
          color: var(--color-gold);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: gap 0.3s ease;
        }

        .btn-card:hover {
          gap: 0.8rem;
        }

        .btn-full {
          width: 100%;
          justify-content: center;
        }

        /* Trusted items */
        .trust-items {
          margin-top: 3rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .trust-item {
          display: flex;
          gap: 1.5rem;
        }

        .trust-icon {
          width: 44px;
          height: 44px;
          background: rgba(194, 161, 95, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-gold);
          flex-shrink: 0;
        }

        .trust-item h4 {
          font-size: 1.1rem;
          margin-bottom: 0.3rem;
        }

        .trust-item p {
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        /* Image Box */
        .image-placeholder {
          width: 100%;
          height: 500px;
          background: linear-gradient(45deg, #001F26, #003D4D);
          border-radius: 32px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .glass-box {
          position: absolute;
          inset: 4rem;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .glass-content h3 {
          font-size: 1.5rem;
          margin: 1.5rem 0 0.5rem;
        }

        .glass-content p {
          color: var(--color-gold);
          font-size: 0.8rem;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        /* CTA Banner */
        .cta-banner {
          background: linear-gradient(135deg, #002B36, #001F26);
          padding: 6rem 2rem;
          border-radius: 40px;
          border: 1px solid rgba(194, 161, 95, 0.2);
        }

        .banner-title {
          font-size: 3rem;
          font-family: var(--font-heading);
          margin-bottom: 1.5rem;
        }

        .banner-subtitle {
          color: var(--text-muted);
          font-size: 1.2rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .btn {
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: var(--color-gold);
          color: #000;
        }

        .btn-primary:hover {
          background: var(--primary-hover);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(194, 161, 95, 0.2);
        }

        .btn-outline {
          border: 1px solid var(--color-gold);
          color: var(--color-gold);
        }

        .btn-outline:hover {
          background: rgba(194, 161, 95, 0.1);
          transform: translateY(-2px);
        }

        /* Utils */
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }

        .gold { color: var(--color-gold); }
        .text-muted { color: var(--text-muted); }
        .uppercase { text-transform: uppercase; letter-spacing: 2px; font-size: 0.8rem; font-weight: 700; }
        .text-center { text-align: center; }
        .bg-surface { background: rgba(255, 255, 255, 0.02); }

        @media (max-width: 768px) {
          .hero-ctas {
            flex-direction: column;
          }
          .grid-2 {
            display: flex;
            flex-direction: column;
            gap: 3rem;
          }
          .solutions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
