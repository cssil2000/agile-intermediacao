'use client';

import React, { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  ArrowRight, 
  Check, 
  Loader2, 
  User, 
  Gavel, 
  Building2, 
  Briefcase,
  ShieldCheck,
  Scale,
  Zap,
  CheckCircle2,
  Lock,
  Target,
  FileSearch,
  Users
} from 'lucide-react';

// Utility functions for masking
const maskProcessNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 7) return digits;
  if (digits.length <= 9) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}`;
  if (digits.length <= 13) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}`;
  if (digits.length <= 14) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}`;
  if (digits.length <= 16) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14, 16)}`;
  return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14, 16)}.${digits.slice(16, 20)}`;
};

const maskPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export default function TrabalhistaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    lead_type: 'reclamante',
    full_name: '',
    process_number: '',
    tribunal: '',
    defendant_company: '',
    estimated_value: '',
    process_stage: '',
    notes: '',
    email: '',
    phone: '',
    privacy_consent: true // Automatically agreed or required via disclaimer
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create Lead
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          lead_type: formData.lead_type as any,
          status: 'novo',
          source_page: '/trabalhista',
          utm_source: searchParams.get('utm_source') || null,
          utm_medium: searchParams.get('utm_medium') || null,
          utm_campaign: searchParams.get('utm_campaign') || null,
          privacy_consent: true,
          privacy_consent_at: new Date().toISOString(),
          notes: formData.notes
        })
        .select()
        .single();

      if (leadError) throw leadError;

      // 2. Create Case
       const { data: caseData, error: caseError } = await supabase
         .from('cases')
         .insert({
           lead_id: leadData.id,
           asset_type: 'trabalhista',
           process_number: formData.process_number,
           tribunal: formData.tribunal,
           defendant_company: formData.defendant_company || 'Não informada',
           estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
           process_stage: formData.process_stage,
           case_status: 'recebido',
           priority: 'media'
         })
         .select()
         .single();

       if (caseError) throw caseError;

       // 3. Activity Log
       await supabase.from('activity_logs').insert({
         case_id: caseData.id,
         lead_id: leadData.id,
         event_type: 'formulario_trabalhista_submetido',
         description: `Novo formulário trabalhista enviado por ${formData.full_name} (${formData.lead_type})`,
         actor_type: 'sistema'
       });

       router.push(`/sucesso?id=${caseData.id}`);

    } catch (err: any) {
      console.error(err);
      setError('Erro ao enviar dados. Verifique os campos e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    reveals.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">
      <Header />
      
      <main>
        {/* HERO SECTION */}
        <section className="hero">
          <div className="container">
            <div className="hero-content reveal">
              <div className="badge">CRÉDITO TRABALHISTA</div>
              <h1 className="hero-title">Antecipe o valor do seu processo trabalhista com análise técnica e segurança jurídica.</h1>
              <p className="hero-subtitle">A Agile estrutura a triagem e avaliação de processos trabalhistas para identificar oportunidades com maior atratividade económica, jurídica e operacional.</p>
              
              <div className="hero-actions">
                <button className="btn btn-primary btn-large" onClick={scrollToForm}>
                  Iniciar Análise <ArrowRight size={20} />
                </button>
                <button className="btn btn-outline btn-large">
                  Falar com a Equipa
                </button>
              </div>
              
              <p className="hero-support">Processos trabalhistas com análise estruturada, foco em valor e resposta em até 48 horas.</p>
            </div>
          </div>
          <div className="hero-bg">
             <div className="pattern-overlay"></div>
          </div>
        </section>

        {/* PARA QUEM SECTION */}
        <section className="section bg-dark">
          <div className="container">
            <div className="section-header reveal">
              <span className="eyebrow">PARA QUEM É</span>
              <h2 className="section-title">Uma solução pensada para quem quer liquidez com mais estratégia</h2>
              <p className="section-description">A frente de Crédito Trabalhista da Agile foi desenhada para trabalhadores, advogados e parceiros que possuem processos em fase compatível e procuram antecipar o recebimento dos seus direitos com mais clareza, estrutura e segurança.</p>
            </div>

            <div className="features-grid">
              <div className="feature-card reveal" style={{ transitionDelay: '0.1s' }}>
                <div className="feature-icon"><User size={24} /></div>
                <h3>Para trabalhadores</h3>
                <p>Para quem já possui um processo trabalhista em fase avançada e deseja avaliar a possibilidade de antecipação.</p>
              </div>

              <div className="feature-card reveal" style={{ transitionDelay: '0.2s' }}>
                <div className="feature-icon"><Scale size={24} /></div>
                <h3>Para advogados</h3>
                <p>Para profissionais que desejam uma análise técnica mais rápida e estruturada para os seus clientes ou carteiras.</p>
              </div>

              <div className="feature-card reveal" style={{ transitionDelay: '0.3s' }}>
                <div className="feature-icon"><Users size={24} /></div>
                <h3>Para parceiros</h3>
                <p>Para quem trabalha com oportunidades jurídicas e quer encaminhar casos com mais segurança e inteligência.</p>
              </div>
            </div>
          </div>
        </section>

        {/* O QUE ANALISAMOS SECTION */}
        <section id="analise" className="section bg-petrol">
          <div className="container">
            <div className="section-header reveal">
              <span className="eyebrow">O QUE ANALISAMOS</span>
              <h2 className="section-title">A Agile não avalia apenas o processo. Avalia a viabilidade da operação.</h2>
              <p className="section-description">Cada caso é analisado com base documental e critérios jurídicos e financeiros, para identificar se há enquadramento real para continuidade da operação.</p>
            </div>

            <div className="criteria-grid">
              {[
                { title: 'Fases Processual', desc: 'Identificação do estágio atual conforme exigido para antecipação.' },
                { title: 'Valor Estimado', desc: 'Cálculo técnico do crédito e atratividade financeira.' },
                { title: 'Documentação Disponível', desc: 'Verificação da integridade documental do processo.' },
                { title: 'Perfil do Polo Passivo', desc: 'Análise de solvência e risco da empresa reclamada.' },
                { title: 'Consistência Jurídica', desc: 'Avaliação do mérito e probabilidade de êxito resiliente.' },
                { title: 'Qualidade das Informações', desc: 'Auditoria dos dados fornecidos para triagem estruturada.' }
              ].map((item, id) => (
                <div key={id} className="criteria-item reveal">
                  <CheckCircle2 size={18} className="gold" />
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="analysis-support reveal">
              <p>A análise da Agile é técnica, criteriosa e orientada por triagem estruturada, reduzindo ruído e aumentando a qualidade da decisão.</p>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA SECTION */}
        <section className="section bg-dark overflow-hidden">
          <div className="container">
            <div className="section-header reveal">
              <span className="eyebrow">COMO FUNCIONA</span>
              <h2 className="section-title">Um processo claro, técnico e objetivo</h2>
            </div>

            <div className="steps-container">
              {[
                { step: '01', title: 'Envio das informações', desc: 'O utilizador preenche os dados principais do processo e envia o caso para avaliação.' },
                { step: '02', title: 'Triagem jurídica e financeira', desc: 'A Agile estrutura as informações e analisa os critérios essenciais da oportunidade.' },
                { step: '03', title: 'Avaliação da viabilidade', desc: 'O processo é lido quanto à fase, documentação, valor, risco e atratividade operacional.' },
                { step: '04', title: 'Retorno da análise', desc: 'Quando o caso se enquadra, a Agile avança com os próximos passos da operação.' }
              ].map((item, id) => (
                <div key={id} className="step-block reveal" style={{ transitionDelay: `${id * 0.1}s` }}>
                  <div className="step-num">{item.step}</div>
                  <div className="step-content-block">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEGURANÇA SECTION */}
        <section className="section bg-petrol">
          <div className="container">
            <div className="section-header reveal">
              <span className="eyebrow">CRITÉRIO E SEGURANÇA</span>
              <h2 className="section-title">Análise séria, informação protegida e processo conduzido com rigor</h2>
              <p className="section-description">A Agile trabalha com critérios objetivos de triagem, leitura documental e avaliação estruturada para garantir que cada análise seja conduzida com consistência, discrição e segurança.</p>
            </div>

            <div className="security-grid">
              <div className="security-card reveal">
                <Lock size={32} className="gold" />
                <h3>Confidencialidade</h3>
                <p>Os dados enviados são tratados em ambiente seguro e com controlo de acesso.</p>
              </div>
              <div className="security-card reveal">
                <FileSearch size={32} className="gold" />
                <h3>Critério técnico</h3>
                <p>Cada oportunidade é analisada com base em estrutura documental e critérios operacionais reais.</p>
              </div>
              <div className="security-card reveal">
                <Target size={32} className="gold" />
                <h3>Foco em qualidade</h3>
                <p>A Agile prioriza casos com maior atratividade e reduz desperdício de tempo com oportunidades fracas.</p>
              </div>
            </div>
          </div>
        </section>

        {/* POR QUE AGILE SECTION */}
        <section className="section bg-dark">
          <div className="container">
            <div className="section-header reveal">
              <span className="eyebrow">POR QUE A AGILE</span>
              <h2 className="section-title">Mais do que intermediação. Uma operação construída para decidir melhor.</h2>
              <p className="section-description">A Agile combina inteligência jurídica, leitura financeira e estrutura de triagem para transformar ativos judiciais em decisões mais rápidas, claras e estratégicas.</p>
            </div>

            <div className="benefits-grid">
              {[
                { title: 'Triagem inteligente', desc: 'Sistemas avançados para qualificação rápida de créditos.' },
                { title: 'Agilidade real', desc: 'Retorno estruturado em prazos agressivos de mercado.' },
                { title: 'Segurança jurídica', desc: 'Protocolos de conformidade em cada etapa da operação.' },
                { title: 'Foco em ativos de maior valor', desc: 'Especialização em processos com alto potencial econômico.' }
              ].map((item, id) => (
                <div key={id} className="benefit-item reveal">
                  <div className="benefit-check"><Zap size={20} /></div>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FORM SECTION (NEW SINGLE-PAGE STRUCTURE) */}
        <section id="form-section" ref={formRef} className="section bg-petrol">
          <div className="container container-medium">
            <div className="section-header reveal">
              <h2 className="section-title">Formulário de Solicitação</h2>
              <p className="section-description">Preencha os campos abaixo para submeter seu ativo judicial.</p>
            </div>

            <div className="form-wrapper reveal">
              <form onSubmit={handleSubmit} className="premium-form">
                
                {/* 01 PERFIL */}
                <div className="form-section">
                   <div className="section-badge-header">
                      <span className="number-badge">01</span>
                      <h3>PERFIL DO SOLICITANTE</h3>
                   </div>
                   <div className="form-row">
                      <div className="form-field">
                         <label>NOME COMPLETO</label>
                         <input 
                            type="text" 
                            placeholder="Digite seu nome" 
                            required 
                            value={formData.full_name}
                            onChange={(e) => updateField('full_name', e.target.value)}
                         />
                      </div>
                      <div className="form-field">
                         <label>TIPO DE RELACIONAMENTO</label>
                         <select 
                            value={formData.lead_type}
                            onChange={(e) => updateField('lead_type', e.target.value)}
                         >
                            <option value="reclamante">Reclamante</option>
                            <option value="advogado">Advogado</option>
                            <option value="parceiro">Parceiro</option>
                         </select>
                      </div>
                   </div>
                </div>

                {/* 02 DADOS DO PROCESSO */}
                <div className="form-section">
                   <div className="section-badge-header">
                      <span className="number-badge">02</span>
                      <h3>DADOS DO PROCESSO</h3>
                   </div>
                   <div className="form-row">
                      <div className="form-field">
                         <label>NÚMERO DO PROCESSO (CNJ)</label>
                         <input 
                            type="text" 
                            placeholder="0000000-00.0000.0.00.0000" 
                            required
                            value={formData.process_number}
                            onChange={(e) => updateField('process_number', maskProcessNumber(e.target.value))}
                         />
                      </div>
                      <div className="form-field">
                         <label>TRIBUNAL (TRT)</label>
                         <input 
                            type="text" 
                            placeholder="Ex: TRT-2 (SP)" 
                            required
                            value={formData.tribunal}
                            onChange={(e) => updateField('tribunal', e.target.value)}
                         />
                      </div>
                   </div>
                </div>

                {/* 03 VALORES E DETALHES */}
                <div className="form-section">
                   <div className="section-badge-header">
                      <span className="number-badge">03</span>
                      <h3>VALORES E DETALHES</h3>
                   </div>
                   <div className="form-row">
                      <div className="form-field">
                         <label>VALOR ESTIMADO DO CRÉDITO</label>
                         <input 
                            type="text" 
                            placeholder="R$ 0,00" 
                            value={formData.estimated_value}
                            onChange={(e) => updateField('estimated_value', e.target.value)}
                         />
                      </div>
                      <div className="form-field">
                         <label>FASE ATUAL</label>
                         <select 
                            value={formData.process_stage}
                            onChange={(e) => updateField('process_stage', e.target.value)}
                         >
                            <option value="">Selecione...</option>
                            <option value="conhecimento">Conhecimento</option>
                            <option value="sentenca">Aguardando Sentença</option>
                            <option value="recurso">Recurso</option>
                            <option value="execucao">Execução</option>
                            <option value="acordo">Acordo</option>
                         </select>
                      </div>
                   </div>
                </div>

                {/* 04 CONTATO */}
                <div className="form-section">
                   <div className="section-badge-header">
                      <span className="number-badge">04</span>
                      <h3>CONTATO</h3>
                   </div>
                   <div className="form-row">
                      <div className="form-field">
                         <label>E-MAIL</label>
                         <input 
                            type="email" 
                            placeholder="seu@email.com" 
                            required
                            value={formData.email}
                            onChange={(e) => updateField('email', e.target.value)}
                         />
                      </div>
                      <div className="form-field">
                         <label>WHATSAPP / TELEFONE</label>
                         <input 
                            type="tel" 
                            placeholder="(00) 00000-0000" 
                            required
                            value={formData.phone}
                            onChange={(e) => updateField('phone', maskPhone(e.target.value))}
                         />
                      </div>
                   </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="form-submit">
                   <button type="submit" className="btn-submit" disabled={loading}>
                      {loading ? 'ENVIANDO...' : 'ENVIAR PARA ANÁLISE ESTRATÉGICA'}
                   </button>
                   <p className="disclaimer">AO ENVIAR, VOCÊ CONCORDA COM NOSSOS TERMOS DE COMPLIANCE E POLÍTICA DE PRIVACIDADE.</p>
                </div>

              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx global>{`
        .landing-page {
          background: #001B22;
          color: #fff;
          overflow-x: hidden;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .container-medium {
          max-width: 900px;
        }

        .section {
          padding: 8rem 0;
          position: relative;
        }

        .bg-dark { background: #001114; }
        .bg-petrol { background: #001B22; }

        /* REVEAL ANIMATION */
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }

        /* HERO */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding-top: 6rem;
          position: relative;
          background: #001B22;
        }

        .hero-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          background: radial-gradient(circle at 70% 30%, rgba(194, 161, 95, 0.05) 0%, transparent 50%);
        }

        .pattern-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: url('/hero-pattern.png');
          background-size: 400px;
          opacity: 0.1;
          mix-blend-mode: overlay;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 850px;
        }

        .badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(194, 161, 95, 0.1);
          border: 1px solid rgba(194, 161, 95, 0.3);
          border-radius: 4px;
          color: var(--color-gold);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 2rem;
        }

        .hero-title {
          font-family: var(--font-heading);
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          line-height: 1.1;
          margin-bottom: 2rem;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 3rem;
          max-width: 650px;
        }

        .hero-actions {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .hero-support {
          font-size: 0.9rem;
          color: var(--text-muted);
          font-style: italic;
        }

        /* SECTION HEADERS */
        .section-header {
          text-align: center;
          max-width: 800px;
          margin: 0 auto 5rem;
        }

        .eyebrow {
          display: block;
          color: var(--color-gold);
          font-weight: 700;
          font-size: 0.8rem;
          letter-spacing: 3px;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
        }

        .section-title {
          font-family: var(--font-heading);
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1.2;
          margin-bottom: 1.5rem;
        }

        .section-description {
          font-size: 1.1rem;
          color: var(--text-muted);
          line-height: 1.6;
        }

        /* PREMIUM FORM STYLES */
        .form-wrapper {
          background: #111a24;
          padding: 4rem;
          border-radius: 4px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .premium-form {
          display: flex;
          flex-direction: column;
          gap: 3.5rem;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .section-badge-header {
          display: flex;
          align-items: center;
          gap: 1.2rem;
        }

        .number-badge {
          background: var(--color-gold);
          color: #000;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          border-radius: 2px;
        }

        .section-badge-header h3 {
          font-size: 1rem;
          letter-spacing: 1.5px;
          font-weight: 700;
          color: var(--color-gold);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .form-field label {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 1px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .form-field input, .form-field select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1rem 1.2rem;
          color: #fff;
          font-size: 0.95rem;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .form-field input:focus, .form-field select:focus {
          border-color: var(--color-gold);
          background: rgba(255, 255, 255, 0.08);
          outline: none;
        }

        .form-submit {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .btn-submit {
          width: 100%;
          background: var(--color-gold);
          color: #000;
          padding: 1.5rem;
          font-weight: 800;
          font-size: 1rem;
          letter-spacing: 1.5px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-submit:hover {
          background: #d4b47a;
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(194, 161, 95, 0.3);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .disclaimer {
          font-size: 0.7rem;
          color: var(--text-muted);
          letter-spacing: 1px;
          text-align: center;
        }

        .error-message {
          color: var(--error);
          text-align: center;
          font-size: 0.9rem;
          background: rgba(255, 87, 87, 0.1);
          padding: 1rem;
          border-radius: 4px;
        }

        /* OTHER SECTION STYLES */
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .feature-card { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); padding: 3rem 2.5rem; border-radius: 4px; transition: all 0.4s ease; }
        .feature-card:hover { transform: translateY(-10px); border-color: rgba(194, 161, 95, 0.3); }
        .feature-icon { width: 50px; height: 50px; background: rgba(194, 161, 95, 0.1); color: var(--color-gold); display: flex; align-items: center; justify-content: center; border-radius: 4px; margin-bottom: 1.5rem; }
        .feature-card h3 { font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 1rem; }
        .feature-card p { color: var(--text-muted); line-height: 1.6; }

        .criteria-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; }
        .criteria-item { display: flex; gap: 1.2rem; padding: 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .criteria-item h4 { font-size: 1.1rem; margin-bottom: 0.4rem; }
        .criteria-item p { font-size: 0.9rem; color: var(--text-muted); }
        .analysis-support { margin-top: 4rem; padding: 2rem; border-left: 3px solid var(--color-gold); background: rgba(194, 161, 95, 0.05); }

        .steps-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 3rem; }
        .step-block { position: relative; }
        .step-num { font-size: 4rem; font-weight: 800; color: rgba(194, 161, 95, 0.1); margin-bottom: -2rem; font-family: var(--font-heading); }
        .step-content-block h4 { font-family: var(--font-heading); color: var(--color-gold); margin-bottom: 1rem; }
        .step-content-block p { color: var(--text-muted); line-height: 1.6; }

        .security-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .security-card { padding: 3rem; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 4px; text-align: center; }
        .security-card h3 { font-family: var(--font-heading); margin: 1.5rem 0 1rem; }
        
        .benefits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .benefit-item { display: flex; gap: 1.5rem; background: rgba(194, 161, 95, 0.05); padding: 2rem; border-radius: 4px; border: 1px solid rgba(194, 161, 95, 0.1); }
        .benefit-check { color: var(--color-gold); }

        /* BUTTONS */
        .btn { padding: 0.8rem 1.8rem; border-radius: 4px; font-weight: 700; display: inline-flex; align-items: center; gap: 0.8rem; cursor: pointer; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: none; font-size: 0.95rem; }
        .btn-large { padding: 1.2rem 2.5rem; font-size: 1rem; }
        .btn-primary { background: var(--color-gold); color: #000; }
        .btn-primary:hover { background: #d4b47a; transform: translateY(-3px); box-shadow: 0 10px 25px rgba(194, 161, 95, 0.3); }
        .btn-outline { background: transparent; border: 1px solid var(--color-gold); color: var(--color-gold); }
        .btn-outline:hover { background: rgba(194, 161, 95, 0.1); transform: translateY(-3px); }

        @media (max-width: 900px) {
          .benefits-grid { grid-template-columns: 1fr; }
          .form-wrapper { padding: 2.5rem; }
        }

        @media (max-width: 600px) {
          .hero { text-align: center; }
          .hero-content { margin: 0 auto; }
          .hero-actions { flex-direction: column; }
          .form-row { grid-template-columns: 1fr; gap: 1.5rem; }
          .container { padding: 0 1rem; }
          .section { padding: 5rem 0; }
        }
      `}</style>
    </div>
  );
}
