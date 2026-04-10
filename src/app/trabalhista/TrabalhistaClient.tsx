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

const parseNumeric = (value: string): number | null => {
  if (!value) return null;
  const cleanValue = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? null : parsed;
};

const STEPS = [
  { number: 1, label: 'Perfil' },
  { number: 2, label: 'Processo' },
  { number: 3, label: 'Valor' },
  { number: 4, label: 'Contato' },
];

export default function TrabalhistaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    lead_type: 'reclamante',
    full_name: '',
    process_number: '',
    tribunal: '',
    defendant_company: '',
    process_stage: '',
    estimated_value: '',
    notes: '',
    email: '',
    phone: '',
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const validateStep = (): string | null => {
    if (currentStep === 1 && !formData.full_name.trim()) {
      return 'Por favor, informe seu nome completo.';
    }
    if (currentStep === 2 && !formData.process_number.trim()) {
      return 'O número do processo (CNJ) é obrigatório.';
    }
    if (currentStep === 4 && !formData.email.trim() && !formData.phone.trim()) {
      return 'Informe pelo menos um contato: e-mail ou telefone.';
    }
    return null;
  };

  const handleNext = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setCurrentStep(s => s + 1);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(s => s - 1);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateStep();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError(null);

    try {
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert({
          full_name: formData.full_name,
          email: formData.email || null,
          phone: formData.phone || null,
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

      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .insert({
          lead_id: leadData.id,
          asset_type: 'trabalhista',
          process_number: formData.process_number,
          tribunal: formData.tribunal || null,
          defendant_company: formData.defendant_company || 'Não informada',
          estimated_value: parseNumeric(formData.estimated_value),
          process_stage: formData.process_stage || null,
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

      fetch('/api/orchestrator/auto-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseData.id })
      }).catch(err => console.warn('[AutoTrigger] Erro (non-blocking):', err));

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
        if (entry.isIntersecting) entry.target.classList.add('active');
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

        {/* MULTI-STEP FORM SECTION */}
        <section id="form-section" ref={formRef} className="section bg-petrol">
          <div className="container container-medium">
            <div className="section-header reveal">
              <span className="eyebrow">SOLICITAR ANÁLISE</span>
              <h2 className="section-title">Formulário de Solicitação</h2>
              <p className="section-description">Preencha os dados em 4 passos simples. Leva menos de 2 minutos.</p>
            </div>

            <div className="form-wrapper reveal">

              {/* PROGRESS BAR */}
              <div className="progress-header">
                <div className="progress-steps">
                  {STEPS.map((step) => {
                    const isDone = currentStep > step.number;
                    const isActive = currentStep === step.number;
                    return (
                      <React.Fragment key={step.number}>
                        <div className={`progress-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                          <div className="progress-circle">
                            {isDone ? <Check size={14} /> : step.number}
                          </div>
                          <span className="progress-label">{step.label}</span>
                        </div>
                        {step.number < STEPS.length && (
                          <div className={`progress-line ${isDone ? 'done' : ''}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                  />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="premium-form">

                {/* STEP 1 — PERFIL */}
                {currentStep === 1 && (
                  <div className="form-step">
                    <div className="step-intro">
                      <span className="number-badge">01</span>
                      <div>
                        <h3>PERFIL DO SOLICITANTE</h3>
                        <p>Quem está enviando esta solicitação?</p>
                      </div>
                    </div>

                    <div className="form-field">
                      <label>NOME COMPLETO <span className="required">*</span></label>
                      <input
                        type="text"
                        placeholder="Digite seu nome completo"
                        value={formData.full_name}
                        onChange={(e) => updateField('full_name', e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="form-field">
                      <label>TIPO DE RELACIONAMENTO</label>
                      <div className="radio-group">
                        {[
                          { value: 'reclamante', label: 'Reclamante', desc: 'Sou o trabalhador titular do processo' },
                          { value: 'advogado', label: 'Advogado', desc: 'Represento o titular do processo' },
                          { value: 'parceiro', label: 'Parceiro', desc: 'Estou encaminhando uma oportunidade' },
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`radio-card ${formData.lead_type === opt.value ? 'selected' : ''}`}
                            onClick={() => updateField('lead_type', opt.value)}
                          >
                            <div className="radio-dot" />
                            <div>
                              <strong>{opt.label}</strong>
                              <span>{opt.desc}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2 — PROCESSO */}
                {currentStep === 2 && (
                  <div className="form-step">
                    <div className="step-intro">
                      <span className="number-badge">02</span>
                      <div>
                        <h3>DADOS DO PROCESSO</h3>
                        <p>Informações sobre o processo trabalhista.</p>
                      </div>
                    </div>

                    <div className="form-field">
                      <label>NÚMERO DO PROCESSO (CNJ) <span className="required">*</span></label>
                      <input
                        type="text"
                        placeholder="0000000-00.0000.0.00.0000"
                        value={formData.process_number}
                        onChange={(e) => updateField('process_number', maskProcessNumber(e.target.value))}
                        autoFocus
                      />
                      <span className="field-hint">O número CNJ está na capa do processo ou na petição inicial.</span>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label>TRIBUNAL (TRT)</label>
                        <input
                          type="text"
                          placeholder="Ex: TRT-2 (SP)"
                          value={formData.tribunal}
                          onChange={(e) => updateField('tribunal', e.target.value)}
                        />
                      </div>
                      <div className="form-field">
                        <label>EMPRESA RÉ (RECLAMADA)</label>
                        <input
                          type="text"
                          placeholder="Nome da empresa"
                          value={formData.defendant_company}
                          onChange={(e) => updateField('defendant_company', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label>FASE ATUAL DO PROCESSO</label>
                      <div className="stage-grid">
                        {[
                          { value: 'recurso', label: 'Recurso', desc: 'Em fase recursal no TRT ou TST' },
                          { value: 'execucao', label: 'Execução', desc: 'Em fase de execução da sentença' },
                          { value: 'acordo', label: 'Acordo', desc: 'Com acordo ou transitado em julgado' },
                          { value: 'sentenca', label: 'Sentença 1ª Inst.', desc: 'Aguardando ou com sentença de 1º grau' },
                          { value: 'conhecimento', label: 'Conhecimento', desc: 'Fase inicial de instrução' },
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`stage-card ${formData.process_stage === opt.value ? 'selected' : ''}`}
                            onClick={() => updateField('process_stage', opt.value)}
                          >
                            <strong>{opt.label}</strong>
                            <span>{opt.desc}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 — VALOR */}
                {currentStep === 3 && (
                  <div className="form-step">
                    <div className="step-intro">
                      <span className="number-badge">03</span>
                      <div>
                        <h3>VALOR E OBSERVAÇÕES</h3>
                        <p>Estimativa financeira e informações adicionais.</p>
                      </div>
                    </div>

                    <div className="form-field">
                      <label>VALOR ESTIMADO DO CRÉDITO</label>
                      <input
                        type="text"
                        placeholder="R$ 0,00"
                        value={formData.estimated_value}
                        onChange={(e) => updateField('estimated_value', e.target.value)}
                        autoFocus
                      />
                      <span className="field-hint">Valor aproximado indicado na sentença, acordo ou cálculo do advogado. Não precisa ser exato.</span>
                    </div>

                    <div className="form-field">
                      <label>OBSERVAÇÕES <span className="optional">(opcional)</span></label>
                      <textarea
                        placeholder="Informações adicionais que possam ser relevantes para a análise..."
                        value={formData.notes}
                        onChange={(e) => updateField('notes', e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4 — CONTATO */}
                {currentStep === 4 && (
                  <div className="form-step">
                    <div className="step-intro">
                      <span className="number-badge">04</span>
                      <div>
                        <h3>CONTATO</h3>
                        <p>Como podemos retornar com o resultado da análise?</p>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label>E-MAIL</label>
                        <input
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="form-field">
                        <label>WHATSAPP / TELEFONE</label>
                        <input
                          type="tel"
                          placeholder="(00) 00000-0000"
                          value={formData.phone}
                          onChange={(e) => updateField('phone', maskPhone(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="consent-box">
                      <ShieldCheck size={18} />
                      <p>Ao enviar, você concorda com nossos termos de compliance e política de privacidade. Seus dados são tratados com confidencialidade e utilizados exclusivamente para a análise solicitada.</p>
                    </div>

                    {/* RESUMO DO CASO */}
                    <div className="summary-box">
                      <p className="summary-title">RESUMO DA SOLICITAÇÃO</p>
                      <div className="summary-grid">
                        <div><span>Nome</span><strong>{formData.full_name}</strong></div>
                        <div><span>Perfil</span><strong>{formData.lead_type}</strong></div>
                        <div><span>Processo</span><strong>{formData.process_number || '—'}</strong></div>
                        <div><span>Fase</span><strong>{formData.process_stage || 'Não informada'}</strong></div>
                        {formData.estimated_value && (
                          <div><span>Valor Est.</span><strong>{formData.estimated_value}</strong></div>
                        )}
                        {formData.defendant_company && (
                          <div><span>Empresa Ré</span><strong>{formData.defendant_company}</strong></div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ERROR */}
                {error && <div className="error-message">{error}</div>}

                {/* NAVIGATION */}
                <div className="form-navigation">
                  {currentStep > 1 && (
                    <button type="button" className="btn-back" onClick={handleBack}>
                      <ArrowLeft size={18} /> Anterior
                    </button>
                  )}
                  <div style={{ flex: 1 }} />
                  {currentStep < STEPS.length ? (
                    <button type="button" className="btn-next" onClick={handleNext}>
                      Próximo <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button type="submit" className="btn-submit" disabled={loading}>
                      {loading ? (
                        <><Loader2 size={18} className="spin" /> Enviando...</>
                      ) : (
                        <>Enviar para Análise <ArrowRight size={18} /></>
                      )}
                    </button>
                  )}
                </div>

              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx global>{`
        .landing-page {
          background: #0d0d0d;
          color: #fff;
          overflow-x: hidden;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .container-medium {
          max-width: 760px;
        }

        .section {
          padding: 8rem 0;
          position: relative;
        }

        .bg-dark { background: #000000; }
        .bg-petrol { background: #0d0d0d; }

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
          padding: 10rem 0 6rem;
          min-height: 85vh;
          display: flex;
          align-items: center;
          background: linear-gradient(to right, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0.4) 100%), url('/hero-trabalhista.png');
          background-size: cover;
          background-position: center;
        }
        .hero-bg {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;
          background: radial-gradient(circle at 70% 30%, rgba(194,161,95,0.05) 0%, transparent 50%);
        }
        .pattern-overlay {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: url('/hero-pattern.png'); background-size: 400px; opacity: 0.05; mix-blend-mode: overlay;
        }
        .hero-content { position: relative; z-index: 2; max-width: 850px; }
        .badge {
          display: inline-block; padding: 0.5rem 1rem;
          background: rgba(194,161,95,0.1); border: 1px solid rgba(194,161,95,0.3);
          border-radius: 4px; color: var(--color-gold); font-size: 0.75rem;
          font-weight: 700; letter-spacing: 2px; margin-bottom: 2rem;
        }
        .hero-title { font-family: var(--font-heading); font-size: clamp(2.5rem,6vw,4.5rem); line-height: 1.1; margin-bottom: 2rem; }
        .hero-subtitle { font-size: 1.25rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 3rem; max-width: 650px; }
        .hero-actions { display: flex; gap: 1.5rem; margin-bottom: 2.5rem; }
        .hero-support { font-size: 0.9rem; color: var(--text-muted); font-style: italic; }

        /* SECTION HEADERS */
        .section-header { text-align: center; max-width: 800px; margin: 0 auto 5rem; }
        .eyebrow { display: block; color: var(--color-gold); font-weight: 700; font-size: 0.8rem; letter-spacing: 3px; margin-bottom: 1.5rem; text-transform: uppercase; }
        .section-title { font-family: var(--font-heading); font-size: clamp(2rem,4vw,3rem); line-height: 1.2; margin-bottom: 1.5rem; }
        .section-description { font-size: 1.1rem; color: var(--text-muted); line-height: 1.6; }

        /* FORM WRAPPER */
        .form-wrapper {
          background: #111111;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6);
        }

        /* PROGRESS HEADER */
        .progress-header {
          padding: 2rem 2.5rem 0;
          background: #0a0a0a;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .progress-steps {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          position: relative;
        }
        .progress-circle {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem; font-weight: 700;
          color: var(--text-muted);
          background: #111;
          transition: all 0.3s ease;
        }
        .progress-step.active .progress-circle {
          border-color: var(--color-gold);
          color: var(--color-gold);
          background: rgba(204,164,59,0.1);
          box-shadow: 0 0 12px rgba(204,164,59,0.2);
        }
        .progress-step.done .progress-circle {
          border-color: var(--color-gold);
          background: var(--color-gold);
          color: #000;
        }
        .progress-label {
          font-size: 0.65rem;
          letter-spacing: 1px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .progress-step.active .progress-label,
        .progress-step.done .progress-label {
          color: var(--color-gold);
        }
        .progress-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin: 0 0.5rem;
          margin-bottom: 1.2rem;
          transition: background 0.3s ease;
        }
        .progress-line.done {
          background: var(--color-gold);
        }
        .progress-bar-track {
          height: 2px;
          background: rgba(255,255,255,0.05);
          margin: 0 -2.5rem;
        }
        .progress-bar-fill {
          height: 100%;
          background: var(--color-gold);
          transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
        }

        /* FORM CONTENT */
        .premium-form {
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .form-step {
          display: flex;
          flex-direction: column;
          gap: 1.8rem;
          animation: fadeSlideIn 0.3s ease;
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .step-intro {
          display: flex;
          align-items: flex-start;
          gap: 1.2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .step-intro h3 {
          font-size: 0.9rem;
          letter-spacing: 2px;
          font-weight: 700;
          color: var(--color-gold);
          margin: 0 0 0.3rem;
        }
        .step-intro p {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin: 0;
        }
        .number-badge {
          background: var(--color-gold);
          color: #000;
          min-width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.85rem;
          border-radius: 4px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* FIELDS */
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .form-field label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 1px;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .form-field input,
        .form-field select,
        .form-field textarea {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 0.9rem 1.1rem;
          color: #fff;
          font-size: 0.95rem;
          border-radius: 6px;
          transition: all 0.25s ease;
          font-family: inherit;
          resize: vertical;
        }
        .form-field input:focus,
        .form-field select:focus,
        .form-field textarea:focus {
          border-color: var(--color-gold);
          background: rgba(255,255,255,0.06);
          outline: none;
          box-shadow: 0 0 0 3px rgba(204,164,59,0.08);
        }
        .form-field select option { background: #111a24; color: #fff; }
        .field-hint { font-size: 0.75rem; color: #4a5568; line-height: 1.4; }
        .required { color: var(--color-gold); }
        .optional { color: #4a5568; font-weight: 400; }

        /* RADIO CARDS */
        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .radio-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.2rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(255,255,255,0.02);
        }
        .radio-card:hover {
          border-color: rgba(204,164,59,0.3);
          background: rgba(204,164,59,0.04);
        }
        .radio-card.selected {
          border-color: var(--color-gold);
          background: rgba(204,164,59,0.07);
        }
        .radio-dot {
          width: 16px; height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .radio-card.selected .radio-dot {
          border-color: var(--color-gold);
          background: var(--color-gold);
          box-shadow: 0 0 0 3px rgba(204,164,59,0.2);
        }
        .radio-card strong {
          display: block;
          font-size: 0.9rem;
          color: #e2e8f0;
          margin-bottom: 0.15rem;
        }
        .radio-card span {
          display: block;
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        /* STAGE GRID */
        .stage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 0.75rem;
        }
        .stage-card {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          padding: 0.9rem 1rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(255,255,255,0.02);
          text-align: center;
        }
        .stage-card:hover {
          border-color: rgba(204,164,59,0.3);
          background: rgba(204,164,59,0.04);
        }
        .stage-card.selected {
          border-color: var(--color-gold);
          background: rgba(204,164,59,0.07);
        }
        .stage-card strong {
          font-size: 0.82rem;
          color: #e2e8f0;
        }
        .stage-card span {
          font-size: 0.7rem;
          color: var(--text-muted);
          line-height: 1.3;
        }

        /* CONSENT BOX */
        .consent-box {
          display: flex;
          gap: 0.8rem;
          align-items: flex-start;
          padding: 1rem 1.2rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px;
          color: var(--text-muted);
          font-size: 0.8rem;
          line-height: 1.5;
        }
        .consent-box svg { color: var(--color-gold); flex-shrink: 0; margin-top: 1px; }

        /* SUMMARY BOX */
        .summary-box {
          background: rgba(204,164,59,0.04);
          border: 1px solid rgba(204,164,59,0.15);
          border-radius: 6px;
          padding: 1.2rem 1.4rem;
        }
        .summary-title {
          font-size: 0.65rem;
          letter-spacing: 2px;
          font-weight: 700;
          color: var(--color-gold);
          margin: 0 0 1rem;
          text-transform: uppercase;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem 2rem;
        }
        .summary-grid div {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .summary-grid span {
          font-size: 0.65rem;
          letter-spacing: 1px;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .summary-grid strong {
          font-size: 0.85rem;
          color: #e2e8f0;
        }

        /* NAVIGATION BUTTONS */
        .form-navigation {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-top: 0.5rem;
        }
        .btn-back {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.85rem 1.4rem;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-back:hover {
          border-color: rgba(255,255,255,0.2);
          color: #fff;
        }
        .btn-next {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.9rem 2rem;
          background: var(--color-gold);
          border: none;
          border-radius: 6px;
          color: #000;
          font-size: 0.9rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .btn-next:hover {
          background: #d4b47a;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(204,164,59,0.25);
        }
        .btn-submit {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.9rem 2rem;
          background: var(--color-gold);
          border: none;
          border-radius: 6px;
          color: #000;
          font-size: 0.9rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .btn-submit:hover:not(:disabled) {
          background: #d4b47a;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(204,164,59,0.25);
        }
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .error-message {
          color: #fc8181;
          font-size: 0.85rem;
          background: rgba(252,129,129,0.08);
          border: 1px solid rgba(252,129,129,0.2);
          padding: 0.8rem 1rem;
          border-radius: 6px;
        }

        /* OTHER SECTIONS */
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px,1fr)); gap: 2rem; }
        .feature-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 3rem 2.5rem; border-radius: 4px; transition: all 0.4s ease; }
        .feature-card:hover { transform: translateY(-10px); border-color: rgba(194,161,95,0.3); }
        .feature-icon { width: 50px; height: 50px; background: rgba(194,161,95,0.1); color: var(--color-gold); display: flex; align-items: center; justify-content: center; border-radius: 4px; margin-bottom: 1.5rem; }
        .feature-card h3 { font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 1rem; }
        .feature-card p { color: var(--text-muted); line-height: 1.6; }

        .criteria-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px,1fr)); gap: 1.5rem; }
        .criteria-item { display: flex; gap: 1.2rem; padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .criteria-item h4 { font-size: 1.1rem; margin-bottom: 0.4rem; }
        .criteria-item p { font-size: 0.9rem; color: var(--text-muted); }
        .analysis-support { margin-top: 4rem; padding: 2rem; border-left: 3px solid var(--color-gold); background: rgba(194,161,95,0.05); }

        .steps-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr)); gap: 3rem; }
        .step-block { position: relative; }
        .step-num { font-size: 4rem; font-weight: 800; color: rgba(194,161,95,0.1); margin-bottom: -2rem; font-family: var(--font-heading); }
        .step-content-block h4 { font-family: var(--font-heading); color: var(--color-gold); margin-bottom: 1rem; }
        .step-content-block p { color: var(--text-muted); line-height: 1.6; }

        .security-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px,1fr)); gap: 2rem; }
        .security-card { padding: 3rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 4px; text-align: center; }
        .security-card h3 { font-family: var(--font-heading); margin: 1.5rem 0 1rem; }

        .benefits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .benefit-item { display: flex; gap: 1.5rem; background: rgba(194,161,95,0.05); padding: 2rem; border-radius: 4px; border: 1px solid rgba(194,161,95,0.1); }
        .benefit-check { color: var(--color-gold); }

        .btn { padding: 0.8rem 1.8rem; border-radius: 4px; font-weight: 700; display: inline-flex; align-items: center; gap: 0.8rem; cursor: pointer; transition: 0.3s; border: none; font-size: 0.95rem; }
        .btn-large { padding: 1.2rem 2.5rem; font-size: 1rem; }
        .btn-primary { background: var(--color-gold); color: #000; }
        .btn-primary:hover { background: #d4b47a; transform: translateY(-3px); box-shadow: 0 10px 25px rgba(194,161,95,0.3); }
        .btn-outline { background: transparent; border: 1px solid var(--color-gold); color: var(--color-gold); }
        .btn-outline:hover { background: rgba(194,161,95,0.1); transform: translateY(-3px); }

        @media (max-width: 640px) {
          .hero { text-align: center; }
          .hero-content { margin: 0 auto; }
          .hero-actions { flex-direction: column; }
          .form-row { grid-template-columns: 1fr; }
          .stage-grid { grid-template-columns: 1fr 1fr; }
          .summary-grid { grid-template-columns: 1fr; }
          .benefits-grid { grid-template-columns: 1fr; }
          .container { padding: 0 1rem; }
          .section { padding: 5rem 0; }
          .premium-form { padding: 1.5rem; }
          .progress-header { padding: 1.5rem 1.5rem 0; }
          .progress-bar-track { margin: 0 -1.5rem; }
          .progress-label { display: none; }
        }
      `}</style>
    </div>
  );
}
