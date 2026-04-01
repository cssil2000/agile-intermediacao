'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle, 
  Plus, 
  Minus,
  Send,
  Search,
  FileCheck,
  Zap,
  Building2,
  Users2,
  Briefcase,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function PrecatoriosClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const faqs = [
    {
      q: "O que é a antecipação de precatório?",
      a: "É a cessão do seu crédito contra o setor público para um investidor. Você recebe o valor à vista, com um desconto (deságio), e deixa de esperar o prazo indefinido de pagamento do governo."
    },
    {
      q: "Quem pode solicitar a análise?",
      a: "Titulares originais, herdeiros (com inventário em dia) ou advogados que possuam honorários destacados no precatório."
    },
    {
      q: "Que informações preciso enviar?",
      a: "O número do precatório e o tribunal de origem. Com isso, nossa tecnologia de triagem já consegue realizar uma pré-análise de validade e risco."
    },
    {
      q: "Em quanto tempo recebo retorno?",
      a: "Nossa meta é enviar um diagnóstico preliminar em até 48 horas úteis após o envio dos dados básicos."
    },
    {
      q: "A análise obriga a fechar negócio?",
      a: "De forma alguma. A análise é gratuita e sem compromisso. Você só avança se a proposta de antecipação for interessante para você."
    }
  ];

  return (
    <div className="precatorios-page">
      <Header />

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="container">
            <div className="hero-grid">
              <div className="hero-text reveal">
                <span className="badge">SOLUÇÕES EM PRECATÓRIOS</span>
                <h1>Transforme sua espera em <span className="gold">liquidez imediata.</span></h1>
                <p>Antecipe seu precatório Federal, Estadual ou Municipal com a Agile. Análise técnica sofisticada e propostas transparentes para você não depender mais do calendário do governo.</p>
                <div className="hero-actions">
                  <Link href="/precatorios/formulario" className="btn btn-primary">Analisar Meu Precatório <ArrowRight size={18} /></Link>
                  <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="btn btn-outline">Falar com Consultor</a>
                </div>
              </div>
              <div className="hero-image reveal">
                 <div className="stats-card">
                    <div className="stat-item">
                       <span className="stat-val">+ R$ 50M</span>
                       <span className="stat-label">Analisados em 2024</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                       <span className="stat-val">48h</span>
                       <span className="stat-label">Tempo Médio de Retorno</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="section bg-surface">
          <div className="container text-center">
            <span className="uppercase gold">Fluxo Simplificado</span>
            <h2 className="section-title">Como funciona a antecipação?</h2>
            <div className="divider"></div>

            <div className="steps-grid mt-4">
              {[
                { icon: <Send />, title: "Envio de Dados", desc: "Você informa o número do precatório e os dados básicos do titular." },
                { icon: <Search />, title: "Triagem Digital", desc: "Nossa tecnologia valida a situação jurídica e o ente devedor (solvência)." },
                { icon: <Briefcase />, title: "Avaliação Técnica", desc: "Especialistas avaliam o prazo médio de pagamento e risco de mercado." },
                { icon: <Zap />, title: "Proposta à Vista", desc: "Apresentamos uma oferta de compra. Se aceito, o pagamento é via escritura pública." }
              ].map((step, i) => (
                <div key={i} className="step-card reveal">
                  <div className="step-icon">{step.icon}</div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* QUEM PODE SOLICITAR */}
        <section className="section">
          <div className="container">
            <div className="grid-2 align-center">
              <div className="reveal">
                <span className="uppercase gold">Elegibilidade</span>
                <h2 className="section-title">Quem pode antecipar os créditos?</h2>
                <div className="divider" style={{margin: '1.5rem 0'}}></div>
                <div className="eligibility-list">
                  <div className="eligibility-item">
                    <div className="item-icon"><Building2 size={24} /></div>
                    <div>
                      <h4>Titulares de Precatórios</h4>
                      <p>Pessoas físicas ou jurídicas que possuem crédito direto contra o Estado.</p>
                    </div>
                  </div>
                  <div className="eligibility-item">
                    <div className="item-icon"><Users2 size={24} /></div>
                    <div>
                      <h4>Herdeiros e Sucessores</h4>
                      <p>Habilitação em inventário para recebimento de créditos legados.</p>
                    </div>
                  </div>
                  <div className="eligibility-item">
                    <div className="item-icon"><Briefcase size={24} /></div>
                    <div>
                      <h4>Advogados</h4>
                      <p>Antecipação de honorários sucumbenciais ou contratuais destacados.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="reveal">
                 <div className="info-box uppercase">
                    <ShieldCheck size={48} className="gold mb-1" />
                    <h3>ANÁLISE SEGURA E CONFIDENCIAL</h3>
                    <p className="text-muted" style={{fontSize: '0.8rem'}}>Seguimos rigorosos padrões de proteção de dados (LGPD).</p>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="section bg-gold-gradient">
          <div className="container">
            <div className="benefits-banner reveal">
              <div className="benefit-content">
                <h2 className="gold">Vantagem Agile: Inteligência que gera valor.</h2>
                <div className="benefit-grid mt-2">
                  <div className="b-item"><CheckCircle2 size={18} /> <span>Análise de Risco Proprietária</span></div>
                  <div className="b-item"><CheckCircle2 size={18} /> <span>Transparência em Taxas e Deságio</span></div>
                  <div className="b-item"><CheckCircle2 size={18} /> <span>Liquidez Imediata pós-Escritura</span></div>
                  <div className="b-item"><CheckCircle2 size={18} /> <span>Assessoria Jurídica Completa</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="section">
          <div className="container small">
            <div className="text-center mb-4 reveal">
              <span className="uppercase gold">Dúvidas Frequentes</span>
              <h2 className="section-title">Perguntas sobre Precatórios</h2>
            </div>
            
            <div className="faq-list">
              {faqs.map((faq, i) => (
                <div key={i} className={`faq-item reveal ${openFaq === i ? 'open' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <div className="faq-question">
                    <span>{faq.q}</span>
                    {openFaq === i ? <Minus size={18} /> : <Plus size={18} />}
                  </div>
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="section pb-xl">
          <div className="container">
            <div className="final-cta reveal text-center">
              <h2>Sua fila de espera termina aqui.</h2>
              <p>Receba hoje o que o governo pagaria em anos.</p>
              <div className="hero-actions mt-2" style={{justifyContent: 'center'}}>
                <Link href="/precatorios/formulario" className="btn btn-primary lg">Analisar Agora <ArrowRight size={20} /></Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .precatorios-page { background: #001F26; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
        .container.small { max-width: 800px; }
        .hero { padding: 10rem 0 6rem; min-height: 80vh; display: flex; align-items: center; background: radial-gradient(circle at top right, rgba(194, 161, 95, 0.08), transparent 40%); }
        .hero-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 4rem; align-items: center; }
        .badge { display: inline-block; font-size: 0.7rem; font-weight: 700; letter-spacing: 2px; color: var(--color-gold); padding: 6px 12px; background: rgba(194, 161, 95, 0.1); border-radius: 4px; margin-bottom: 2rem; }
        h1 { font-family: var(--font-heading); font-size: clamp(2.5rem, 5vw, 4rem); line-height: 1.1; margin-bottom: 1.5rem; }
        .hero-text p { font-size: 1.2rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 3rem; }
        .hero-actions { display: flex; gap: 1rem; }
        .stats-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(194, 161, 95, 0.2); border-radius: 24px; padding: 3rem; backdrop-filter: blur(10px); display: flex; flex-direction: column; gap: 2rem; text-align: center; }
        .stat-val { display: block; font-size: 2.5rem; font-weight: 700; color: var(--color-gold); font-family: var(--font-heading); }
        .stat-label { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
        .stat-divider { height: 1px; background: rgba(255, 255, 255, 0.05); }
        .section { padding: 8rem 0; }
        .section-title { font-family: var(--font-heading); font-size: 2.5rem; margin: 1rem 0; }
        .divider { width: 80px; height: 4px; background: var(--color-gold); margin: 0 auto; border-radius: 2px; }
        .steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 2rem; }
        .step-card { background: #121d26; padding: 3rem 2rem; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.03); transition: transform 0.3s ease; }
        .step-card:hover { transform: translateY(-5px); border-color: rgba(194, 161, 95, 0.3); }
        .step-icon { width: 56px; height: 56px; background: rgba(194, 161, 95, 0.1); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: var(--color-gold); margin: 0 auto 2rem; }
        .step-card h3 { font-family: var(--font-heading); font-size: 1.3rem; margin-bottom: 1rem; }
        .step-card p { font-size: 0.95rem; color: var(--text-muted); line-height: 1.6; }
        .eligibility-list { display: flex; flex-direction: column; gap: 2rem; margin-top: 3rem; }
        .eligibility-item { display: flex; gap: 1.5rem; }
        .item-icon { width: 48px; height: 48px; background: rgba(255, 255, 255, 0.03); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--color-gold); flex-shrink: 0; }
        .eligibility-item h4 { font-size: 1.1rem; margin-bottom: 0.3rem; }
        .eligibility-item p { font-size: 0.9rem; color: var(--text-muted); }
        .info-box { background: linear-gradient(135deg, #0a1118, #121d26); padding: 4rem; border-radius: 32px; border: 1px solid rgba(194, 161, 95, 0.1); text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
        .bg-gold-gradient { background: linear-gradient(135deg, #001F26, #002B36); border-top: 1px solid rgba(194, 161, 95, 0.1); border-bottom: 1px solid rgba(194, 161, 95, 0.1); }
        .benefits-banner { padding: 4rem; border-radius: 32px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); }
        .benefits-banner h2 { font-family: var(--font-heading); font-size: 2.2rem; margin-bottom: 3rem; text-align: center; }
        .benefit-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; }
        .b-item { display: flex; align-items: center; gap: 1rem; font-size: 1.1rem; font-weight: 500; }
        .b-item :global(svg) { color: var(--color-gold); }
        .faq-list { margin-top: 3rem; display: flex; flex-direction: column; gap: 1rem; }
        .faq-item { background: #121d26; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all 0.3s ease; }
        .faq-question { display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 1.1rem; }
        .faq-answer { max-height: 0; overflow: hidden; transition: all 0.4s ease; color: var(--text-muted); font-size: 1rem; margin-top: 0; }
        .faq-item.open .faq-answer { max-height: 300px; margin-top: 1.5rem; }
        .final-cta { padding: 6rem; background: radial-gradient(circle at center, rgba(194, 161, 95, 0.05), transparent); }
        .final-cta h2 { font-family: var(--font-heading); font-size: 3rem; margin-bottom: 1rem; }
        .btn { padding: 1rem 2rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 0.8rem; transition: all 0.3s ease; }
        .btn.lg { padding: 1.2rem 3rem; font-size: 1.1rem; }
        .btn-primary { background: var(--color-gold); color: #000; }
        .btn-outline { border: 1px solid var(--color-gold); color: var(--color-gold); }
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
        .reveal.active { opacity: 1; transform: translateY(0); }
        .gold { color: var(--color-gold); }
        .uppercase { text-transform: uppercase; letter-spacing: 2px; font-size: 0.8rem; font-weight: 700; }
        .bg-surface { background: rgba(255, 255, 255, 0.02); }
        .text-center { text-align: center; }
        @media (max-width: 768px) { .hero-grid { grid-template-columns: 1fr; text-align: center; gap: 3rem; } .hero-actions { flex-direction: column; } .grid-2 { grid-template-columns: 1fr; } .benefit-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
