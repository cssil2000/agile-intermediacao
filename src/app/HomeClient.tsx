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

export default function HomeClient() {
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
        {/* HERO PRINCIPAL */}
        <section className="hero">
          <div className="container">
            <div className="hero-content reveal">
              <span className="badge-premium">INTELIGÊNCIA JURÍDICO-FINANCEIRA</span>
              <h1 className="hero-title">
                Sua ponte estratégica para a <span className="gold">antecipação de crédito trabalhista</span> no Brasil.
              </h1>
              <h2 className="hero-subtitle">
                A Agile estrutura operações de análise, triagem e antecipação para processos trabalhistas de maior atratividade. De forma complementar, também atua na negociação estratégica de precatórios.
              </h2>
              <div className="hero-ctas">
                <Link href="/trabalhista" className="btn btn-primary">Analisar Crédito Trabalhista <ArrowRight size={18} /></Link>
                <Link href="/precatorios" className="btn btn-outline">Negociar Precatório</Link>
              </div>
              <p className="hero-support">
                Análise técnica, segura e estruturada para quem busca liquidez sem depender do tempo da justiça.
              </p>
            </div>
          </div>
        </section>

        {/* SECCÃO — NOSSA PRINCIPAL ATUAÇÃO */}
        <section className="section main-focus">
          <div className="container">
            <div className="grid-2 align-center">
              <div className="reveal">
                <span className="eyebrow">ATUAÇÃO PRINCIPAL</span>
                <h2 className="section-title">Especialistas em Crédito Trabalhista</h2>
                <p className="text-large">
                  Hoje, a principal frente da Agile é a antecipação de crédito trabalhista. Atuamos com análise técnica, triagem estruturada e foco em processos com maior potencial económico e jurídico, permitindo decisões mais rápidas, seguras e eficientes.
                </p>
                <div className="bullet-list">
                  <div className="bullet-item">
                    <CheckCircle2 size={20} className="gold" />
                    <span>Foco em casos de maior valor</span>
                  </div>
                  <div className="bullet-item">
                    <CheckCircle2 size={20} className="gold" />
                    <span>Análise jurídica e financeira estruturada</span>
                  </div>
                  <div className="bullet-item">
                    <CheckCircle2 size={20} className="gold" />
                    <span>Triagem inteligente para oportunidades mais qualificadas</span>
                  </div>
                  <div className="bullet-item">
                    <CheckCircle2 size={20} className="gold" />
                    <span>Processo conduzido com segurança e clareza</span>
                  </div>
                </div>
              </div>
              <div className="reveal">
                <div className="image-wrapper premium-border">
                  <img src="/trabalhista-main.png" alt="Análise de Ativos Judiciais" className="full-image" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECCÃO — FRENTES DE ATUAÇÃO */}
        <section id="solucoes" className="section solutions bg-surface-alt">
          <div className="container">
            <div className="section-header reveal text-center">
              <span className="eyebrow">NOSSAS FRENTES</span>
              <h2 className="section-title">Soluções em crédito trabalhista e precatórios</h2>
              <p className="section-subtitle">
                A Agile atua prioritariamente na antecipação de crédito trabalhista e também desenvolve operações estratégicas na negociação de precatórios, sempre com análise técnica, inteligência de triagem e foco em ativos de maior atratividade.
              </p>
            </div>

            <div className="solutions-grid">
              {/* CARD 1: CRÉDITO TRABALHISTA */}
              <div className="solution-card featured reveal">
                <div className="card-badge">Principal atuação</div>
                <h3>Crédito Trabalhista</h3>
                <p>
                  Solução ideal para trabalhadores, advogados e parceiros que possuem processos em fase compatível e desejam antecipar o recebimento dos seus direitos com mais estratégia, clareza e segurança.
                </p>
                <div className="card-features">
                  <div className="feature-item"><CheckCircle2 size={16} /> Análise em até 48 horas</div>
                  <div className="feature-item"><CheckCircle2 size={16} /> Foco em causas de maior valor</div>
                  <div className="feature-item"><CheckCircle2 size={16} /> Triagem jurídica e financeira</div>
                  <div className="feature-item"><CheckCircle2 size={16} /> Estrutura pensada para agilidade real</div>
                </div>
                <Link href="/trabalhista" className="btn btn-primary btn-full">
                  Analisar Crédito Trabalhista <ArrowRight size={16} />
                </Link>
              </div>

              {/* CARD 2: PRECATÓRIOS */}
              <div className="solution-card reveal">
                <div className="card-badge gold-outline">Frente estratégica</div>
                <h3>Precatórios</h3>
                <p>
                  Operação complementar para titulares, advogados e parceiros que desejam negociar precatórios com avaliação técnica, leitura documental e estrutura de decisão voltada à liquidez e previsibilidade.
                </p>
                <div className="card-features">
                  <div className="feature-item"><CheckCircle2 size={16} /> Análise técnica do crédito</div>
                  <div className="feature-item"><CheckCircle2 size={16} /> Operações com natureza alimentar ou comum</div>
                  <div className="feature-item"><CheckCircle2 size={16} /> Estrutura para casos federais, estaduais e municipais</div>
                  <div className="feature-item"><CheckCircle2 size={16} /> Compra total ou parcial, conforme viabilidade</div>
                </div>
                <Link href="/precatorios" className="btn btn-outline btn-full">
                  Negociar Precatório <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECÇÃO — COMO FUNCIONA */}
        <section id="como-funciona" className="section steps-section">
          <div className="container">
            <div className="section-header reveal text-center">
              <span className="eyebrow">COMO FUNCIONA</span>
              <h2 className="section-title">Um processo claro, técnico e orientado por análise</h2>
              <p className="section-subtitle">A Agile transforma oportunidades jurídicas em decisões estruturadas. Cada caso passa por uma leitura técnica para garantir clareza, segurança e velocidade na tomada de decisão.</p>
            </div>

            <div className="steps-grid">
              <div className="step-card reveal">
                <div className="step-number">01</div>
                <h3>Envio das informações</h3>
                <p>O cliente ou parceiro envia os dados do processo ou do precatório para análise inicial.</p>
              </div>
              <div className="step-card reveal">
                <div className="step-number">02</div>
                <h3>Triagem técnica</h3>
                <p>A equipa estrutura os dados jurídicos e financeiros e verifica o enquadramento da oportunidade.</p>
              </div>
              <div className="step-card reveal">
                <div className="step-number">03</div>
                <h3>Avaliação estratégica</h3>
                <p>O caso é analisado quanto à documentação, risco, valor e viabilidade operacional.</p>
              </div>
              <div className="step-card reveal">
                <div className="step-number">04</div>
                <h3>Retorno da Agile</h3>
                <p>Quando aplicável, a oportunidade avança para proposta e continuidade da operação.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECÇÃO — BENEFÍCIOS / DIFERENCIAIS */}
        <section id="beneficios" className="section bg-surface">
          <div className="container">
            <div className="section-header reveal text-center">
              <span className="eyebrow">POR QUE ESCOLHER A AGILE?</span>
              <h2 className="section-title">Tecnologia, critério e segurança no mercado de ativos judiciais</h2>
              <p className="section-subtitle">A Agile não atua como mera intermediadora. É uma operação estruturada para filtrar oportunidades com mais qualidade, reduzir ruído na análise e apoiar decisões com clareza jurídica e financeira.</p>
            </div>
            
            <div className="benefits-grid">
              <div className="benefit-block reveal">
                <div className="benefit-icon"><Zap size={24} /></div>
                <h3>Agilidade Real</h3>
                <p>Reduzimos o tempo de triagem e organizamos a leitura do caso para que a decisão aconteça com mais rapidez.</p>
              </div>
              <div className="benefit-block reveal">
                <div className="benefit-icon"><Shield size={24} /></div>
                <h3>Segurança Jurídica</h3>
                <p>Cada oportunidade é analisada com base documental, critérios claros e acompanhamento técnico.</p>
              </div>
              <div className="benefit-block reveal">
                <div className="benefit-icon"><BarChart3 size={24} /></div>
                <h3>Inteligência de Triagem</h3>
                <p>A combinação entre estrutura operacional e tecnologia permite priorizar casos mais fortes e reduzir perda de tempo com ativos fracos.</p>
              </div>
              <div className="benefit-block reveal">
                <div className="benefit-icon"><CheckCircle2 size={24} /></div>
                <h3>Foco em Ativos de Valor</h3>
                <p>A Agile direciona energia para oportunidades com real atratividade económica e operacional.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECÇÃO — CONFIANÇA E AUTORIDADE */}
        <section className="section authority-section bg-navy-deep">
          <div className="container">
            <div className="authority-content reveal text-center">
              <span className="eyebrow">ESTRUTURA E CONFIANÇA</span>
              <h2 className="section-title">Mais do que intermediação. Uma operação construída para decidir melhor.</h2>
              <p className="section-subtitle">A Agile combina visão jurídica, leitura financeira e tecnologia de triagem para criar uma operação mais clara, mais segura e mais eficiente. O objetivo não é apenas acelerar a análise, mas qualificar as decisões e dar mais consistência à operação.</p>
              
              <div className="authority-highlight premium-border mt-4">
                 <Scale size={48} className="gold mb-2" />
                 <h3>Excelência em Ativos Judiciais</h3>
                 <p className="gold uppercase tracking-widest">Agile Intermediação</p>
              </div>

              <p className="text-muted mt-4 max-w-2xl mx-auto">
                Atuamos com confidencialidade, rastreabilidade e foco em ativos judiciais de maior relevância, preservando a segurança da informação e a qualidade do processo.
              </p>
            </div>
          </div>
        </section>

        {/* SECÇÃO — CTA FINAL */}
        <section className="section final-cta">
          <div className="container">
            <div className="cta-box reveal text-center">
              <h2 className="section-title">Pronto para antecipar os seus direitos com mais clareza?</h2>
              <p className="section-subtitle">Envie as informações do seu caso para análise técnica e receba uma avaliação estruturada da Agile.</p>
              
              <div className="hero-ctas mt-3">
                <Link href="/trabalhista" className="btn btn-primary">Analisar Crédito Trabalhista</Link>
                <Link href="/precatorios" className="btn btn-outline">Negociar Precatório</Link>
              </div>

              <p className="hero-support mt-3">
                Crédito trabalhista como principal frente de atuação. <br/>
                Precatórios como solução complementar estratégica.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .homepage {
          overflow-x: hidden;
          background-color: var(--background);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .hero {
          padding: 12rem 0 8rem;
          min-height: 90vh;
          display: flex;
          align-items: center;
          position: relative;
          background: radial-gradient(circle at 70% 30%, rgba(194, 161, 95, 0.08), transparent 40%),
                      radial-gradient(circle at 10% 70%, rgba(13, 46, 58, 0.4), transparent 50%);
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('/hero-pattern.png') center/cover no-repeat;
          opacity: 0.1;
          pointer-events: none;
        }

        .hero-content {
          text-align: center;
          max-width: 850px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }

        .badge-premium {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 3px;
          padding: 0.6rem 1.2rem;
          background: rgba(194, 161, 95, 0.05);
          border: 1px solid rgba(194, 161, 95, 0.3);
          border-radius: 4px;
          color: var(--color-gold);
          margin-bottom: 2.5rem;
          text-transform: uppercase;
        }

        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4.2rem);
          font-family: var(--font-heading);
          line-height: 1.1;
          margin-bottom: 1.5rem;
          font-weight: 700;
        }

        .hero-title .gold {
          color: var(--color-gold);
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-muted);
          max-width: 700px;
          margin: 0 auto 3rem;
          line-height: 1.6;
          font-weight: 400;
        }

        .hero-ctas {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .hero-support {
          font-size: 0.9rem;
          color: var(--text-muted);
          max-width: 450px;
          margin: 0 auto;
          line-height: 1.5;
          opacity: 0.8;
          border-left: 2px solid var(--border);
          padding-left: 1rem;
        }

        .section {
          padding: 10rem 0;
        }

        .section-header {
          margin-bottom: 5rem;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .eyebrow {
          display: block;
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 3px;
          color: var(--color-gold);
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        .section-title {
          font-size: clamp(2rem, 4vw, 3rem);
          font-family: var(--font-heading);
          line-height: 1.2;
          margin-bottom: 1.5rem;
          font-weight: 700;
        }

        .section-subtitle {
          font-size: 1.1rem;
          color: var(--text-muted);
          line-height: 1.6;
        }

        /* MAIN FOCUS SECTION */
        .main-focus {
          background: linear-gradient(180deg, var(--background) 0%, var(--surface) 100%);
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 5rem;
          align-items: center;
        }

        .text-large {
          font-size: 1.15rem;
          color: var(--text-muted);
          line-height: 1.7;
          margin-bottom: 2.5rem;
        }

        .bullet-list {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .bullet-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 1rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
        }

        .image-wrapper {
          width: 100%;
          aspect-ratio: 1/1;
          background: var(--surface-light);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .full-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s ease;
        }

        .image-wrapper:hover .full-image {
          transform: scale(1.05);
        }

        .premium-border {
          border: 1px solid var(--border);
          box-shadow: 0 0 40px rgba(0, 0, 0, 0.3);
        }

        /* SOLUTIONS SECTION */
        .bg-surface-alt {
          background-color: #0b2229;
        }

        .solutions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 3rem;
        }

        .solution-card {
          padding: 4rem 3rem;
          background: var(--surface);
          border: 1px solid var(--border);
          position: relative;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .solution-card:hover {
          transform: translateY(-10px);
          border-color: var(--color-gold);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
        }

        .solution-card.featured {
          background: linear-gradient(135deg, #0d2e3a 0%, #0a252e 100%);
          border-color: rgba(194, 161, 95, 0.4);
        }

        .card-badge {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 2px;
          padding: 0.4rem 0.8rem;
          background: var(--color-gold);
          color: #000;
          text-transform: uppercase;
          margin-bottom: 2rem;
          align-self: flex-start;
        }

        .card-badge.gold-outline {
          background: transparent;
          border: 1px solid var(--color-gold);
          color: var(--color-gold);
        }

        .solution-card h3 {
          font-size: 2rem;
          font-family: var(--font-heading);
          margin-bottom: 1.5rem;
        }

        .solution-card p {
          color: var(--text-muted);
          margin-bottom: 2.5rem;
          flex: 1;
        }

        .card-features {
          margin-bottom: 3rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.8);
        }

        /* STEPS SECTION */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .step-card {
          padding: 3rem 2rem;
          background: transparent;
          border-left: 1px solid var(--border);
          position: relative;
        }

        .step-number {
          font-size: 3rem;
          font-family: var(--font-heading);
          color: var(--color-gold);
          opacity: 0.3;
          margin-bottom: 1rem;
        }

        .step-card h3 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .step-card p {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        /* BENEFITS SECTION */
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 2.5rem;
        }

        .benefit-block {
          padding: 2.5rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }

        .benefit-block:hover {
          background: rgba(194, 161, 95, 0.05);
          border-color: var(--border);
        }

        .benefit-icon {
          width: 50px;
          height: 50px;
          background: rgba(194, 161, 95, 0.1);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-gold);
          margin-bottom: 1.5rem;
        }

        .benefit-block h3 {
          font-size: 1.2rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .benefit-block p {
          color: var(--text-muted);
          font-size: 0.9rem;
          line-height: 1.6;
        }

        /* AUTHORITY SECTION */
        .authority-section {
          background-color: #05161d;
        }

        .authority-highlight {
          max-width: 500px;
          margin: 3rem auto;
          padding: 4rem 2rem;
          background: var(--surface);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .authority-highlight h3 {
          font-family: var(--font-heading);
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
        }

        /* FINAL CTA */
        .cta-box {
          background: linear-gradient(135deg, #0d2e3a 0%, #05161d 100%);
          padding: 6rem 3rem;
          border-radius: 4px;
          border: 1px solid var(--border);
        }

        .btn {
          padding: 1rem 2.5rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 0.85rem;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.8rem;
        }

        .btn-primary {
          background: var(--color-gold);
          color: #000;
        }

        .btn-primary:hover {
          background: #d4b470;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(194, 161, 95, 0.3);
        }

        .btn-outline {
          border: 1px solid var(--color-gold);
          color: var(--color-gold);
        }

        .btn-outline:hover {
          background: rgba(194, 161, 95, 0.1);
          transform: translateY(-2px);
        }

        .btn-full {
          width: 100%;
          justify-content: center;
        }

        /* UTILS */
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
        .text-center { text-align: center; }
        .mt-3 { margin-top: 1.5rem; }
        .mt-4 { margin-top: 2.5rem; }
        .opacity-20 { opacity: 0.2; }
        .max-w-2xl { max-width: 42rem; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .tracking-widest { letter-spacing: 0.1em; }
        .uppercase { text-transform: uppercase; }

        @media (max-width: 968px) {
          .grid-2 {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
          .hero-ctas {
            flex-direction: column;
          }
          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
