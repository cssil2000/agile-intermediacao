'use client';

import React, { useState, Suspense } from 'react';
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
  Scale
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
    // Step 1
    lead_type: 'reclamante',
    full_name: '',
    // Step 2
    process_number: '',
    tribunal: '',
    defendant_company: '',
    estimated_value: '',
    // Step 3
    process_stage: '',
    notes: '',
    // Step 4
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
          privacy_consent: formData.privacy_consent,
          privacy_consent_at: new Date().toISOString(),
          notes: formData.notes
        })
        .select()
        .single();

      if (leadError) throw leadError;

       // 2. Create Case (Asset Type = Trabalhista)
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

       // 3. Activity Log
       await supabase.from('activity_logs').insert({
         case_id: caseData.id,
         lead_id: leadData.id,
         event_type: 'formulario_trabalhista_submetido',
         description: `Novo formulário trabalhista enviado por ${formData.full_name} (${formData.lead_type})`,
         actor_type: 'sistema'
       });

       // 4. Redirect to Generic Success
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
      {/* Progress Bar */}
      <div className="progress-bar">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`progress-step ${step >= s ? 'active' : ''} ${step > s ? 'completed' : ''}`}>
            <div className="step-dot">{step > s ? <Check size={14} /> : s}</div>
            <span>{s === 1 ? 'Perfil' : s === 2 ? 'Processo' : s === 3 ? 'Detalhes' : 'Contato'}</span>
          </div>
        ))}
      </div>

      <div className="form-card">
        {/* STEP 1: PERFIL */}
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

        {/* STEP 2: DADOS DO PROCESSO */}
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

        {/* STEP 3: DETALHES */}
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

        {/* STEP 4: CONTATO */}
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
  return (
    <div className="form-page">
      <Header />
      <main className="container-small">
        <Suspense fallback={<div className="status-container"><Loader2 className="animate-spin gold" size={48} /> <p>Carregando formulário...</p></div>}>
          <TrabalhistaForm />
        </Suspense>
      </main>
      <Footer />

      <style jsx>{`
        .form-page { background: #001F26; min-height: 100vh; }
        .container-small { max-width: 700px; margin: 0 auto; padding: 8rem 1.5rem 6rem; }
        .status-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; min-height: 40vh; color: var(--text-muted); }
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

        .nav-card { background: rgba(255, 255, 255, 0.03); border: 2px solid transparent; border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.8rem; cursor: pointer; transition: all 0.3s ease; width: 100%; }
        .nav-card.active { border-color: var(--color-gold); background: rgba(194, 161, 95, 0.05); color: var(--color-gold); }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.2rem; }
        label { font-size: 0.85rem; font-weight: 600; color: #fff; }
        input, select, textarea { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: 8px; padding: 0.8rem 1rem; color: #fff; font-size: 0.95rem; }
        input:focus { border-color: var(--color-gold); outline: none; }
        
        .input-prefix { display: flex; align-items: center; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .input-prefix span { padding: 0 1rem; background: rgba(255, 255, 255, 0.05); border-right: 1px solid var(--border); color: var(--text-muted); }
        .input-prefix input { border: none; width: 100%; }

        .form-actions { margin-top: 2.5rem; display: flex; gap: 1rem; }
        .form-actions.space-between { justify-content: space-between; }
        .btn { padding: 0.8rem 1.5rem; border-radius: 10px; font-weight: 600; display: flex; align-items: center; gap: 0.6rem; cursor: pointer; transition: 0.3s ease; }
        .btn-primary { background: var(--color-gold); color: #000; }
        .btn-outline { border: 1px solid var(--color-gold); color: var(--color-gold); }
        .btn-full { width: 100%; justify-content: center; }
        .btn:disabled { opacity: 0.5; }

        .consent-area { display: flex; align-items: flex-start; padding: 1rem; background: rgba(255, 255, 255, 0.02); border-radius: 8px; }
        .checkbox-container { display: flex; gap: 1rem; cursor: pointer; }
        .consent-text { font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; }
        .error-msg { color: var(--error); font-size: 0.85rem; margin-top: 1rem; text-align: center; }
        .gold { color: var(--color-gold); }
        .grid-2-mob { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 600px) { .form-grid, .grid-2-mob { grid-template-columns: 1fr; } .form-card { padding: 2rem 1.5rem; } }
      `}</style>
    </div>
  );
}
