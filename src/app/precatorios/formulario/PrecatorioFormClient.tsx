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
  FileText, 
  Info, 
  Phone,
  ShieldCheck,
  Building2
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

function PrecatorioForm() {
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
    precatorio_number: '',
    court_origin: '',
    public_entity: '',
    credit_nature: 'alimentar',
    estimated_face_value: '',
    payment_year: '',
    // Step 3
    priority_right: 'nao_sei',
    lawyer_name: '',
    lawyer_contact: '',
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
          source_page: '/precatorios/formulario',
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

       // 2. Create Case
       const { data: caseData, error: caseError } = await supabase
         .from('cases')
         .insert({
           lead_id: leadData.id,
           asset_type: 'precatorio',
           precatorio_number: formData.precatorio_number,
           court_origin: formData.court_origin,
           public_entity: formData.public_entity,
           credit_nature: formData.credit_nature as any,
           estimated_face_value: formData.estimated_face_value ? parseFloat(formData.estimated_face_value) : null,
           payment_year: formData.payment_year ? parseInt(formData.payment_year) : null,
           priority_right: formData.priority_right === 'sim',
           lawyer_name: formData.lawyer_name,
           lawyer_contact: formData.lawyer_contact,
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
         event_type: 'formulario_precatorio_submetido',
         description: `Novo formulário de precatório enviado por ${formData.full_name}`,
         actor_type: 'sistema'
       });

       // 4. Redirect to Success
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
            <span>{s === 1 ? 'Perfil' : s === 2 ? 'Dados' : s === 3 ? 'Extras' : 'Contato'}</span>
          </div>
        ))}
      </div>

      <div className="form-card">
        {/* STEP 1: PERFIL */}
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <User size={24} className="gold" />
              <h2>Quem está solicitando?</h2>
              <p>Informe o seu perfil para personalizarmos o atendimento.</p>
            </div>
            
            <div className="form-group grid-2-mob">
              <button 
                className={`nav-card ${formData.lead_type === 'reclamante' ? 'active' : ''}`}
                onClick={() => updateField('lead_type', 'reclamante')}
              >
                <User size={20} />
                <span>Titular do Precatório</span>
              </button>
              <button 
                className={`nav-card ${formData.lead_type === 'advogado' ? 'active' : ''}`}
                onClick={() => updateField('lead_type', 'advogado')}
              >
                <Building2 size={20} />
                <span>Advogado / Consultor</span>
              </button>
            </div>

            <div className="form-group mt-2">
              <label>Nome Completo</label>
              <input 
                type="text" 
                placeholder="Ex: João da Silva" 
                value={formData.full_name}
                onChange={(e) => updateField('full_name', e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-primary btn-full" 
                disabled={!formData.full_name || !formData.lead_type}
                onClick={nextStep}
              >
                Próximo Passo <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DADOS DO PRECATÓRIO */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <FileText size={24} className="gold" />
              <h2>Informações do Ativo</h2>
              <p>Esses dados são essenciais para nossa triagem digital.</p>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Número do Precatório</label>
                <input 
                  type="text" 
                  placeholder="Ex: 0000000-00.2024.8.26.0000" 
                  value={formData.precatorio_number}
                  onChange={(e) => updateField('precatorio_number', maskProcessNumber(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Tribunal de Origem</label>
                <input 
                  type="text" 
                  placeholder="Ex: TJSP, TRF3..." 
                  value={formData.court_origin}
                  onChange={(e) => updateField('court_origin', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Ente Devedor (Público)</label>
                <input 
                  type="text" 
                  placeholder="Ex: Estado de SP, INSS..." 
                  value={formData.public_entity}
                  onChange={(e) => updateField('public_entity', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Natureza do Crédito</label>
                <select value={formData.credit_nature} onChange={(e) => updateField('credit_nature', e.target.value)}>
                  <option value="alimentar">Alimentar (Salários, Benefícios)</option>
                  <option value="comum">Comum (Danos, Tributário)</option>
                  <option value="outro">Outro/Não Sei</option>
                </select>
              </div>
              <div className="form-group">
                <label>Valor de Face (Estimado)</label>
                <div className="input-prefix">
                   <span>R$</span>
                   <input 
                    type="number" 
                    placeholder="0.00" 
                    value={formData.estimated_face_value}
                    onChange={(e) => updateField('estimated_face_value', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Ano Previsto (Opcional)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 2026" 
                  value={formData.payment_year}
                  onChange={(e) => updateField('payment_year', e.target.value)}
                />
              </div>
            </div>

            <div className="form-actions space-between">
              <button className="btn btn-outline" onClick={prevStep}>Voltar</button>
              <button 
                className="btn btn-primary" 
                disabled={!formData.precatorio_number || !formData.public_entity}
                onClick={nextStep}
              >
                Próximo Passo <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: EXTRAS */}
        {step === 3 && (
          <div className="step-content">
            <div className="step-header">
              <Info size={24} className="gold" />
              <h2>Detalhes Complementares</h2>
              <p>Estes campos ajudam a acelerar a análise jurídica.</p>
            </div>

            <div className="form-group">
              <label>Possui Direito de Prioridade (Idoso/Doença)?</label>
              <div className="radio-group">
                <button className={formData.priority_right === 'sim' ? 'active' : ''} onClick={() => updateField('priority_right', 'sim')}>Sim</button>
                <button className={formData.priority_right === 'nao' ? 'active' : ''} onClick={() => updateField('priority_right', 'nao')}>Não</button>
                <button className={formData.priority_right === 'nao_sei' ? 'active' : ''} onClick={() => updateField('priority_right', 'nao_sei')}>Não Sei</button>
              </div>
            </div>

            <div className="form-grid mt-2">
              <div className="form-group">
                <label>Nome do Advogado (Opcional)</label>
                <input 
                  type="text" 
                  value={formData.lawyer_name}
                  onChange={(e) => updateField('lawyer_name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Contato do Advogado (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="(11) 99999-9999"
                  value={formData.lawyer_contact}
                  onChange={(e) => updateField('lawyer_contact', maskPhone(e.target.value))}
                />
              </div>
            </div>

            <div className="form-group mt-2">
               <label>Observações</label>
               <textarea 
                rows={3} 
                placeholder="Algo mais que devamos saber?" 
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
              <Phone size={24} className="gold" />
              <h2>Dados de Contato</h2>
              <p>Como podemos enviar o diagnóstico da sua análise?</p>
            </div>

            <div className="form-group">
              <label>Email Profissional/Pessoal</label>
              <input 
                type="email" 
                placeholder="ex@exemplo.com" 
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>WhatsApp / Telefone</label>
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
                  <span className="consent-text">Autorizo o tratamento dos meus dados para análise do precatório conforme a Política de Privacidade.</span>
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
                {loading ? <><Loader2 className="animate-spin" size={18} /> Processando...</> : <>Enviar para Análise <ShieldCheck size={18} /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PrecatorioFormClient() {
  return (
    <div className="form-page">
      <Header />
      <main className="container-small">
        <Suspense fallback={<div className="status-container"><Loader2 className="animate-spin gold" size={48} /> <p>Carregando formulário...</p></div>}>
          <PrecatorioForm />
        </Suspense>
      </main>
      <Footer />

      <style jsx>{`
        .form-page { background: #0d0d0d; min-height: 100vh; }
        .container-small { max-width: 700px; margin: 0 auto; padding: 8rem 1.5rem 6rem; }
        .status-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; min-height: 40vh; color: var(--text-muted); }
        .form-container { display: flex; flex-direction: column; gap: 2rem; }
        .progress-bar { display: flex; justify-content: space-between; padding: 0 1rem; margin-bottom: 1rem; }
        .progress-step { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; position: relative; z-index: 1; }
        .progress-step span { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
        .step-dot { width: 32px; height: 32px; border-radius: 50%; background: #161616; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--text-muted); transition: all 0.3s ease; }
        .progress-step.active .step-dot { border-color: var(--color-gold); color: #fff; box-shadow: 0 0 15px rgba(194, 161, 95, 0.3); }
        .progress-step.completed .step-dot { background: var(--color-gold); border-color: var(--color-gold); color: #000; }
        .form-card { background: #161616; padding: 3rem; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); }
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
        .radio-group { display: flex; gap: 1rem; }
        .radio-group button { flex: 1; padding: 0.8rem; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: 8px; font-weight: 600; transition: all 0.3s ease; }
        .radio-group button.active { background: var(--color-gold); color: #000; border-color: var(--color-gold); }
        .form-actions { margin-top: 2.5rem; display: flex; gap: 1rem; }
        .form-actions.space-between { justify-content: space-between; }
        .btn { padding: 0.8rem 1.5rem; border-radius: 10px; font-weight: 600; display: flex; align-items: center; gap: 0.6rem; transition: all 0.3s ease; cursor: pointer; }
        .btn-primary { background: var(--color-gold); color: #000; }
        .btn-outline { border: 1px solid var(--color-gold); color: var(--color-gold); }
        .btn-full { width: 100%; justify-content: center; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .consent-area { display: flex; align-items: flex-start; padding: 1rem; background: rgba(255, 255, 255, 0.02); border-radius: 8px; }
        .checkbox-container { display: flex; gap: 1rem; cursor: pointer; }
        .consent-text { font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; }
        .error-msg { color: var(--error); font-size: 0.85rem; margin-top: 1rem; text-align: center; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .gold { color: var(--color-gold); }
        .grid-2-mob { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .form-card { padding: 2rem 1.5rem; } .grid-2-mob { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
