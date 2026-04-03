'use client';

import React, { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  ArrowRight, 
  ArrowLeft, 
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

type Step = 1 | 2 | 3 | 4;

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

function TrabalhistaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(1);
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
    privacy_consent: false
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setStep(prev => (prev + 1) as Step);
  const prevStep = () => setStep(prev => (prev - 1) as Step);

  const handleSubmit = async () => {
    if (!formData.privacy_consent) {
      setError('Você precisa aceitar os termos de privacidade.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
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
          privacy_consent: formData.privacy_consent,
          privacy_consent_at: new Date().toISOString(),
          notes: formData.notes
        })
        .select()
        .single();

      if (leadError) throw leadError;

       const { data: caseData, error: caseError } = await supabase
         .from('cases')
         .insert({
           lead_id: leadData.id,
           asset_type: 'trabalhista',
           process_number: formData.process_number,
           tribunal: formData.tribunal,
           defendant_company: formData.defendant_company,
           estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
           process_stage: formData.process_stage,
           case_status: 'recebido',
           priority: 'media'
         })
         .select()
         .single();

       if (caseError) throw caseError;

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
      setError('Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="progress-bar">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`progress-step ${step >= s ? 'active' : ''} ${step > s ? 'completed' : ''}`}>
            <div className="step-dot">{step > s ? <Check size={14} /> : s}</div>
            <span>{s === 1 ? 'Perfil' : s === 2 ? 'Processo' : s === 3 ? 'Detalhes' : 'Contato'}</span>
          </div>
        ))}
      </div>

      <div className="form-card">
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <User size={24} className="gold" />
              <h2>Análise de Crédito Trabalhista</h2>
              <p>Inicie sua jornada para a liquidez. Quem está solicitando?</p>
            </div>
            
            <div className="form-group grid-2-mob">
              <button 
                className={`nav-card ${formData.lead_type === 'reclamante' ? 'active' : ''}`}
                onClick={() => updateField('lead_type', 'reclamante')}
              >
                <User size={20} />
                <span>Reclamante (Trabalhador)</span>
              </button>
              <button 
                className={`nav-card ${formData.lead_type === 'advogado' ? 'active' : ''}`}
                onClick={() => updateField('lead_type', 'advogado')}
              >
                <Scale size={20} />
                <span>Advogado da Causa</span>
              </button>
            </div>

            <div className="form-group mt-2">
              <label>Nome Completo</label>
              <input 
                type="text" 
                placeholder="Seu nome ou nome da sua banca" 
                value={formData.full_name}
                onChange={(e) => updateField('full_name', e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-primary btn-full" 
                disabled={!formData.full_name}
                onClick={nextStep}
              >
                Próximo Passo <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <Gavel size={24} className="gold" />
              <h2>Dados do Processo</h2>
              <p>Precisamos desses dados para localizar e avaliar o crédito.</p>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Número do Processo (CNJ)</label>
                <input 
                  type="text" 
                  placeholder="0000000-00.0000.0.00.0000" 
                  value={formData.process_number}
                  onChange={(e) => updateField('process_number', maskProcessNumber(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Tribunal (TRT)</label>
                <input 
                  type="text" 
                  placeholder="Ex: TRT2, TRT15..." 
                  value={formData.tribunal}
                  onChange={(e) => updateField('tribunal', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Empresa Reclamada (Empresa)</label>
                <input 
                  type="text" 
                  placeholder="Ex: Banco X, Empresa Y..." 
                  value={formData.defendant_company}
                  onChange={(e) => updateField('defendant_company', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Valor Estimado do Crédito</label>
                <div className="input-prefix">
                   <span>R$</span>
                   <input 
                    type="number" 
                    placeholder="0.00" 
                    value={formData.estimated_value}
                    onChange={(e) => updateField('estimated_value', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-actions space-between">
              <button className="btn btn-outline" onClick={prevStep}>Voltar</button>
              <button 
                className="btn btn-primary" 
                disabled={!formData.process_number || !formData.defendant_company}
                onClick={nextStep}
              >
                Próximo Passo <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <div className="step-header">
              <Briefcase size={24} className="gold" />
              <h2>Fase Processual</h2>
              <p>Informe o estágio atual para uma análise mais precisa.</p>
            </div>

            <div className="form-group">
              <label>Situação Atual</label>
              <select value={formData.process_stage} onChange={(e) => updateField('process_stage', e.target.value)}>
                <option value="">Selecione...</option>
                <option value="conhecimento">Fase de Conhecimento</option>
                <option value="sentenca">Aguardando Sentença</option>
                <option value="recurso">Em Grau de Recurso</option>
                <option value="execucao">Fase de Execução (Cálculos)</option>
                <option value="acordo">Acordo Homologado</option>
              </select>
            </div>

            <div className="form-group mt-2">
               <label>Observações Adicionais</label>
               <textarea 
                rows={4} 
                placeholder="Descreva detalhes que podem ajudar na análise (ex: solvência da empresa, expectativa de prazo)." 
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
               />
            </div>

            <div className="form-actions space-between">
              <button className="btn btn-outline" onClick={prevStep}>Voltar</button>
              <button className="btn btn-primary" onClick={nextStep}>Próximo Passo <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step-content">
            <div className="step-header">
              <ShieldCheck size={24} className="gold" />
              <h2>Finalizar Solicitação</h2>
              <p>Complete seus dados para receber o retorno da nossa equipe.</p>
            </div>

            <div className="form-group">
              <label>Seu Email</label>
              <input 
                type="email" 
                placeholder="email@exemplo.com" 
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>WhatsApp / Celular</label>
              <input 
                type="tel" 
                placeholder="(00) 00000-0000" 
                value={formData.phone}
                onChange={(e) => updateField('phone', maskPhone(e.target.value))}
              />
            </div>

            <div className="consent-area mt-2">
               <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={formData.privacy_consent}
                    onChange={(e) => updateField('privacy_consent', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="consent-text">Confirmo que os dados informados são verdadeiros e autorizo o processamento conforme a LGPD.</span>
               </label>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <div className="form-actions space-between">
              <button className="btn btn-outline" onClick={prevStep} disabled={loading}>Voltar</button>
              <button 
                className="btn btn-primary" 
                onClick={handleSubmit}
                disabled={loading || !formData.email || !formData.phone || !formData.privacy_consent}
              >
                {loading ? <><Loader2 className="animate-spin" size={18} /> Enviando...</> : <>Solicitar Análise Gratuita <ArrowRight size={18} /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrabalhistaClient() {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
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

        {/* FORM SECTION (FINAL CTA INTEGRATED) */}
        <section id="form-section" ref={formRef} className="section bg-petrol">
          <div className="container container-narrow">
            <div className="section-header reveal">
              <h2 className="section-title">Pronto para analisar o seu crédito trabalhista?</h2>
              <p className="section-description">Envie as informações do seu processo e receba uma avaliação técnica estruturada da Agile.</p>
            </div>

            <Suspense fallback={<div className="status-container"><Loader2 className="animate-spin gold" size={48} /> <p>Carregando formulário...</p></div>}>
              <TrabalhistaForm />
            </Suspense>

            <div className="form-footer reveal">
              <p>Resposta em até 48 horas, com triagem técnica e foco em oportunidades de maior atratividade.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .landing-page {
          background: var(--bg-deep);
          color: #fff;
          overflow-x: hidden;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .container-narrow {
          max-width: 800px;
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
          opacity: 0.15;
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

        /* GRIDS & CARDS */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 3rem 2.5rem;
          border-radius: 12px;
          transition: all 0.4s ease;
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(194, 161, 95, 0.3);
          transform: translateY(-10px);
        }

        .feature-icon {
          width: 50px;
          height: 50px;
          background: rgba(194, 161, 95, 0.1);
          color: var(--color-gold);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .feature-card h3 {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }

        .feature-card p {
          color: var(--text-muted);
          line-height: 1.6;
        }

        .criteria-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .criteria-item {
          display: flex;
          gap: 1.2rem;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .criteria-item h4 {
          font-size: 1.1rem;
          margin-bottom: 0.4rem;
          color: #fff;
        }

        .criteria-item p {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .analysis-support {
          margin-top: 4rem;
          padding: 2rem;
          border-left: 3px solid var(--color-gold);
          background: rgba(194, 161, 95, 0.05);
          text-align: left;
          max-width: 700px;
        }

        /* STEPS */
        .steps-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 3rem;
        }

        .step-block {
          position: relative;
        }

        .step-num {
          font-size: 4rem;
          font-weight: 800;
          color: rgba(194, 161, 95, 0.1);
          margin-bottom: -2rem;
          font-family: var(--font-heading);
        }

        .step-content-block h4 {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          margin-bottom: 1rem;
          color: var(--color-gold);
          position: relative;
          z-index: 1;
        }

        .step-content-block p {
          color: var(--text-muted);
          line-height: 1.6;
          position: relative;
          z-index: 1;
        }

        /* SECURITY */
        .security-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .security-card {
          padding: 3rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          text-align: center;
        }

        .security-card h3 {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          margin: 1.5rem 0 1rem;
        }

        .security-card p {
          color: var(--text-muted);
          line-height: 1.6;
        }

        /* BENEFITS */
        .benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .benefit-item {
          display: flex;
          gap: 1.5rem;
          background: rgba(194, 161, 95, 0.05);
          padding: 2rem;
          border-radius: 8px;
          border: 1px solid rgba(194, 161, 95, 0.1);
        }

        .benefit-check {
          color: var(--color-gold);
          flex-shrink: 0;
        }

        .benefit-item h4 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .benefit-item p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        /* FORM BLOCK */
        .form-footer {
          margin-top: 3rem;
          text-align: center;
          font-size: 0.95rem;
          color: var(--text-muted);
          font-style: italic;
        }

        /* --- FORM LOGIC STYLES (MATCHED TO LANDING) --- */
        .form-container { display: flex; flex-direction: column; gap: 2rem; }
        .progress-bar { display: flex; justify-content: space-between; padding: 0 1rem; }
        .progress-step { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; position: relative; }
        .progress-step span { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
        .step-dot { width: 32px; height: 32px; border-radius: 50%; background: #121d26; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--text-muted); transition: all 0.3s ease; }
        .progress-step.active .step-dot { border-color: var(--color-gold); color: #fff; box-shadow: 0 0 15px rgba(194, 161, 95, 0.3); }
        .progress-step.completed .step-dot { background: var(--color-gold); border-color: var(--color-gold); color: #000; }

        .form-card { background: #121d26; padding: 3rem; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); }
        .step-header { text-align: center; margin-bottom: 2.5rem; }
        .step-header h2 { font-family: var(--font-heading); font-size: 1.8rem; margin: 1rem 0 0.5rem; }
        .step-header p { color: var(--text-muted); font-size: 0.95rem; }

        .nav-card { background: rgba(255, 255, 255, 0.03); border: 2px solid transparent; border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.8rem; cursor: pointer; transition: all 0.3s ease; width: 100%; color: #fff; font-weight: 600; }
        .nav-card.active { border-color: var(--color-gold); background: rgba(194, 161, 95, 0.05); color: var(--color-gold); }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.2rem; text-align: left; }
        label { font-size: 0.85rem; font-weight: 600; color: #fff; }
        input, select, textarea { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: 8px; padding: 0.8rem 1rem; color: #fff; font-size: 0.95rem; font-family: inherit; }
        input:focus { border-color: var(--color-gold); outline: none; }
        
        .input-prefix { display: flex; align-items: center; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .input-prefix span { padding: 0 1rem; background: rgba(255, 255, 255, 0.05); border-right: 1px solid var(--border); color: var(--text-muted); }
        .input-prefix input { border: none; width: 100%; }

        .form-actions { margin-top: 2.5rem; display: flex; gap: 1rem; }
        .form-actions.space-between { justify-content: space-between; }
        
        /* BUTTONS */
        .btn { padding: 0.8rem 1.8rem; border-radius: 8px; font-weight: 700; display: inline-flex; align-items: center; gap: 0.8rem; cursor: pointer; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: none; font-size: 0.95rem; }
        .btn-large { padding: 1.2rem 2.5rem; font-size: 1rem; }
        .btn-primary { background: var(--color-gold); color: #000; }
        .btn-primary:hover { background: #d4b47a; transform: translateY(-3px); box-shadow: 0 10px 25px rgba(194, 161, 95, 0.3); }
        .btn-outline { background: transparent; border: 1px solid var(--color-gold); color: var(--color-gold); }
        .btn-outline:hover { background: rgba(194, 161, 95, 0.1); transform: translateY(-3px); }
        .btn-full { width: 100%; justify-content: center; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .consent-area { display: flex; align-items: flex-start; padding: 1.2rem; background: rgba(255, 255, 255, 0.02); border-radius: 8px; text-align: left; }
        .checkbox-container { display: flex; gap: 1rem; cursor: pointer; }
        .consent-text { font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; }
        .error-msg { color: var(--error); font-size: 0.85rem; margin-top: 1rem; text-align: center; }
        .gold { color: var(--color-gold); }
        .grid-2-mob { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .benefits-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 600px) {
          .hero { text-align: center; }
          .hero-content { margin: 0 auto; }
          .hero-actions { flex-direction: column; }
          .form-grid, .grid-2-mob { grid-template-columns: 1fr; }
          .form-card { padding: 2rem 1.5rem; }
          .criteria-grid { grid-template-columns: 1fr; }
          .steps-container { grid-template-columns: 1fr; }
          .section { padding: 5rem 0; }
        }
      `}</style>
    </div>
  );
}
