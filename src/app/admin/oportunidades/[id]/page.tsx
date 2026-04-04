'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Gavel, 
  Building2, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ShieldCheck,
  FileText,
  Mail,
  Phone,
  Tag,
  Hash,
  Loader2,
  Save
} from 'lucide-react';

export default function CaseDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    fetchCaseDetails();
  }, [id]);

  async function fetchCaseDetails() {
    setLoading(true);
    try {
      const { data: caseData, error } = await supabase
        .from('cases')
        .select('*, lead:leads(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setData(caseData);
      setStatus(caseData.case_status);
      setPriority(caseData.priority);
      setInternalNotes(caseData.ai_summary || ''); // Using ai_summary as notes for now, but could be a separate field
    } catch (err) {
      console.error(err);
      // Handle error or redirect
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('cases')
        .update({
          case_status: status as any,
          priority: priority as any,
          ai_summary: internalNotes // Saving notes to ai_summary
        })
        .eq('id', id);

      if (error) throw error;
      
      // Log activity
      await supabase.from('activity_logs').insert({
        case_id: id,
        event_type: 'atualizacao_admin',
        description: `Status alterado para ${status} e prioridade para ${priority}`,
        actor_type: 'admin'
      });

      alert('Caso atualizado com sucesso!');
      fetchCaseDetails();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar o caso.');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 className="animate-spin" size={32} color="#c2a15f" />
        <p>Carregando detalhes do caso...</p>
        <style jsx>{`
          .loading-container { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: #8d9596; }
        `}</style>
      </div>
    );
  }

  if (!data) return <div>Caso não encontrado.</div>;

  return (
    <div className="case-detail-container">
      <div className="header-actions">
        <button onClick={() => router.back()} className="back-btn">
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="action-group">
          <button className="btn btn-primary" onClick={handleUpdate} disabled={updating}>
            {updating ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Salvar Alterações
          </button>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left Column: Case Information */}
        <div className="main-column">
          <div className="card case-header-card">
            <div className="ref-badge">#{data.internal_reference}</div>
            <div className="title-row">
              <h1>{data.lead?.full_name}</h1>
              <span className={`asset-tag type-${data.asset_type}`}>
                {data.asset_type === 'trabalhista' ? 'Causa Trabalhista' : 'Precatório'}
              </span>
            </div>
            <div className="meta-row">
              <span><Calendar size={14} /> Recebido em {new Date(data.created_at).toLocaleDateString()}</span>
              <span><Tag size={14} /> {data.lead?.lead_type === 'advogado' ? 'Advogado' : 'Reclamante'}</span>
            </div>
          </div>

          <div className="card-grid-2">
            <div className="card info-card">
              <h3><Gavel size={18} /> Dados Judiciais</h3>
              <div className="info-list">
                <div className="info-item">
                  <label>Número do Processo</label>
                  <span>{data.process_number || 'Não informado'}</span>
                </div>
                <div className="info-item">
                  <label>Tribunal / TRT</label>
                  <span>{data.tribunal || 'Não informado'}</span>
                </div>
                <div className="info-item">
                  <label>Fase Processual</label>
                  <span>{data.process_stage || 'Não informado'}</span>
                </div>
                <div className="info-item">
                  <label>Reclamada / Ente Público</label>
                  <span>{data.defendant_company || data.public_entity || 'Não informado'}</span>
                </div>
              </div>
            </div>

            <div className="card info-card">
              <h3><DollarSign size={18} /> Valores e Crédito</h3>
              <div className="info-list">
                <div className="info-item">
                  <label>Valor Estimado</label>
                  <span className="value-high">
                    {data.estimated_value 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.estimated_value)
                      : 'Não informado'}
                  </span>
                </div>
                {data.asset_type === 'precatorio' && (
                  <>
                    <div className="info-item">
                      <label>Natureza</label>
                      <span>{data.credit_nature}</span>
                    </div>
                    <div className="info-item">
                      <label>Ano Previsão PGTO</label>
                      <span>{data.payment_year || 'Não informado'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="card info-card mt-2">
            <h3><FileText size={18} /> Notas e Observações do Lead</h3>
            <p className="lead-notes">{data.lead?.notes || 'Nenhuma observação deixada pelo lead.'}</p>
          </div>

          <div className="card info-card mt-2">
            <h3><ShieldCheck size={18} /> Notas Internas / Resumo AI</h3>
            <textarea 
              className="internal-textarea"
              placeholder="Adicione notas internas sobre a análise deste caso..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={6}
            />
          </div>
        </div>

        {/* Right Column: Management */}
        <div className="sidebar-column">
          <div className="card management-card">
            <h3>Gestão do Caso</h3>
            
            <div className="form-group">
              <label>Status do Processo</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="select-input">
                <option value="recebido">Recebido</option>
                <option value="em_analise">Em Análise</option>
                <option value="revisao_humana">Revisão Humana</option>
                <option value="aprovado">Aprovado</option>
                <option value="rejeitado">Rejeitado</option>
                <option value="proposta">Proposta Enviada</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </div>

            <div className="form-group mt-1">
              <label>Prioridade</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="select-input">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="premium">Premium / VIP</option>
              </select>
            </div>

            <div className="status-indicator mt-2">
               <div className={`status-pill pill-${status}`}>
                 {status === 'recebido' && <Clock size={16} />}
                 {status === 'aprovado' && <CheckCircle2 size={16} />}
                 {status === 'rejeitado' && <XCircle size={16} />}
                 {(status === 'em_analise' || status === 'revisao_humana') && <AlertCircle size={16} />}
                 {status.replace('_', ' ')}
               </div>
            </div>
          </div>

          <div className="card contact-card mt-2">
            <h3>Contato do Lead</h3>
            <div className="contact-list">
              <div className="contact-item">
                <Mail size={16} />
                <span>{data.lead?.email}</span>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <span>{data.lead?.phone}</span>
              </div>
            </div>
            <button className="btn btn-outline btn-full mt-1">
              Enviar Proposta (WhatsApp)
            </button>
          </div>

          <div className="card audit-card mt-2">
            <h3>Audit Log</h3>
            <div className="audit-timeline">
              <div className="audit-step">
                <div className="audit-dot active"></div>
                <div className="audit-info">
                  <strong>Formulário Enviado</strong>
                  <span>{new Date(data.created_at).toLocaleString()}</span>
                </div>
              </div>
              {/* Future: Map activity_logs here */}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .case-detail-container { padding-bottom: 4rem; }
        .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .back-btn { display: flex; align-items: center; gap: 0.5rem; color: #8d9596; font-weight: 500; transition: 0.2s; }
        .back-btn:hover { color: #fff; }

        .detail-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; }
        
        .card { background: #121d26; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.05); padding: 1.5rem; }
        .mt-2 { margin-top: 1.5rem; }
        .mt-1 { margin-top: 1rem; }

        .case-header-card { position: relative; margin-bottom: 1.5rem; }
        .ref-badge { position: absolute; right: 1.5rem; top: 1.5rem; background: rgba(194, 161, 95, 0.1); color: #c2a15f; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; border: 1px solid rgba(194, 161, 95, 0.2); }
        .title-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
        h1 { font-size: 1.75rem; font-weight: 800; }
        .meta-row { display: flex; gap: 1.5rem; color: #8d9596; font-size: 0.875rem; }
        .meta-row span { display: flex; align-items: center; gap: 0.4rem; }

        .card-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        h3 { font-size: 1rem; font-weight: 700; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.6rem; color: #c2a15f; }
        
        .info-list { display: flex; flex-direction: column; gap: 1.25rem; }
        .info-item { display: flex; flex-direction: column; gap: 0.25rem; }
        .info-item label { font-size: 0.75rem; color: #8d9596; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-item span { font-size: 1rem; font-weight: 500; }
        .value-high { font-size: 1.25rem !important; font-weight: 800 !important; color: #fff; }

        .asset-tag { font-size: 0.75rem; padding: 4px 10px; border-radius: 6px; font-weight: 600; }
        .type-trabalhista { background: rgba(194,161,95,0.1); color: #c2a15f; }
        .type-precatorio { background: rgba(59,130,246,0.1); color: #3b82f6; }

        .lead-notes { font-size: 0.95rem; line-height: 1.6; color: #cfd8d9; font-style: italic; }
        .internal-textarea { width: 100%; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1rem; color: #fff; resize: vertical; outline: none; }
        .internal-textarea:focus { border-color: #c2a15f; }

        .management-card h3 { color: #fff; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.8rem; color: #8d9596; font-weight: 600; }
        .select-input { background: #1a2a35; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.6rem; color: #fff; outline: none; transition: 0.2s; }
        .select-input:focus { border-color: #c2a15f; }

        .status-pill { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; border-radius: 12px; font-weight: 700; font-size: 0.9rem; text-transform: capitalize; }
        .pill-recebido { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .pill-aprovado { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .pill-rejeitado { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .pill-em_analise, .pill-revisao_humana { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }

        .contact-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
        .contact-item { display: flex; align-items: center; gap: 0.8rem; color: #fff; font-size: 0.9rem; }
        .contact-item svg { color: #8d9596; }

        .btn { padding: 0.75rem 1.25rem; border-radius: 10px; font-weight: 700; display: flex; align-items: center; gap: 0.6rem; cursor: pointer; transition: 0.3s; }
        .btn-primary { background: #c2a15f; color: #000; }
        .btn-outline { border: 1px solid #c2a15f; color: #c2a15f; }
        .btn-full { width: 100%; justify-content: center; }
        .btn:hover:not(:disabled) { transform: translateY(-2px); }

        .audit-timeline { margin-top: 1rem; display: flex; flex-direction: column; gap: 1rem; }
        .audit-step { display: flex; gap: 1rem; }
        .audit-dot { width: 8px; height: 8px; border-radius: 50%; background: #2a3a45; margin-top: 5px; position: relative; }
        .audit-dot.active { background: #c2a15f; box-shadow: 0 0 8px #c2a15f; }
        .audit-dot::after { content: ''; position: absolute; top: 12px; left: 3px; width: 2px; height: 20px; background: #2a3a45; }
        .audit-step:last-child .audit-dot::after { display: none; }
        .audit-info { display: flex; flex-direction: column; }
        .audit-info strong { font-size: 0.875rem; color: #fff; }
        .audit-info span { font-size: 0.75rem; color: #8d9596; }

        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } .card-grid-2 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
