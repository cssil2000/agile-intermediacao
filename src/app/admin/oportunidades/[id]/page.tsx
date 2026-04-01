'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Case, CaseStatus, CasePriority, ActivityLog, AppDocument } from '@/types';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Calendar, 
  FileText, 
  History, 
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  DollarSign,
  Gavel
} from 'lucide-react';
import Link from 'next/link';

export default function OportunidadeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<Case | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    fetchCaseDetail();
  }, [id]);

  async function fetchCaseDetail() {
    setLoading(true);
    try {
      const { data: caseData } = await supabase
        .from('cases')
        .select('*, lead:leads(*)')
        .eq('id', id)
        .single();
      
      if (caseData) {
        setData(caseData);
        setEditData({ ...caseData });
        
        // Fetch logs
        const { data: logData } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('case_id', id)
          .order('created_at', { ascending: false });
        if (logData) setLogs(logData);

        // Fetch documents
        const { data: docData } = await supabase
          .from('documents')
          .select('*')
          .eq('case_id', id)
          .order('created_at', { ascending: false });
        if (docData) setDocuments(docData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: CaseStatus) {
    if (!data) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('cases')
        .update({ case_status: newStatus })
        .eq('id', data.id);

      if (!error) {
        // Log activity
        await supabase.from('activity_logs').insert([{
          case_id: data.id,
          event_type: 'status_change',
          description: `Alterou estado de ${data.case_status} para ${newStatus}`,
          actor_type: 'admin'
        }]);
        
        setData({ ...data, case_status: newStatus });
        fetchCaseDetail(); // Refresh logs
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  async function handlePriorityChange(newPriority: CasePriority) {
    if (!data) return;
    setUpdating(true);
    try {
      await supabase
        .from('cases')
        .update({ priority: newPriority })
        .eq('id', data.id);

      await supabase.from('activity_logs').insert([{
        case_id: data.id,
        event_type: 'priority_change',
        description: `Alterou prioridade para ${newPriority}`,
        actor_type: 'admin'
      }]);
      
      setData({ ...data, priority: newPriority });
      fetchCaseDetail();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  async function handleSaveEdit() {
    if (!data) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('cases')
        .update({
          defendant_company: editData.defendant_company,
          estimated_value: editData.estimated_value,
          process_stage: editData.process_stage,
          public_entity: editData.public_entity,
          credit_nature: editData.credit_nature,
          estimated_face_value: editData.estimated_face_value,
          payment_year: editData.payment_year,
          discount_expectation: editData.discount_expectation,
          lawyer_name: editData.lawyer_name,
          lawyer_contact: editData.lawyer_contact
        })
        .eq('id', data.id);

      if (!error) {
        await supabase.from('activity_logs').insert([{
          case_id: data.id,
          event_type: 'field_edit',
          description: `Atualizou dados do ativo manualmente`,
          actor_type: 'admin'
        }]);
        setData({ ...data, ...editData });
        setIsEditing(false);
        fetchCaseDetail();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className="loading">Carregando detalhes...</div>;
  if (!data) return <div className="error">Oportunidade não encontrada.</div>;

  return (
    <div className="detail-container">
      <div className="nav-header">
        <button className="back-btn" onClick={() => router.back()}>
          <ArrowLeft size={20} />
          Voltar
        </button>
        <div className="header-meta">
          <span className="ref">{data.internal_reference}</span>
          <span className={`asset-tag type-${data.asset_type}`}>{data.asset_type}</span>
        </div>
      </div>

      <div className="header-main">
        <div className="lead-info">
          <h1>{data.lead?.name}</h1>
          <div className="lead-badges">
            <span className={`badge badge-status-${data.case_status}`}>{data.case_status}</span>
            <span className={`priority-tag ${data.priority}`}>{data.priority}</span>
          </div>
        </div>
        <div className="action-buttons">
          <button 
            className={`btn-edit ${isEditing ? 'active' : ''}`}
            onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
            disabled={updating}
          >
            {isEditing ? 'Salvar Alterações' : 'Editar Dados'}
          </button>
          <select 
            value={data.case_status} 
            onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
            disabled={updating}
          >
            <option value="recebido">Recebido</option>
            <option value="em_analise">Em Análise</option>
            <option value="revisao_humana">Revisão Humana</option>
            <option value="aprovado">Aprovar</option>
            <option value="rejeitado">Rejeitar</option>
            <option value="proposta">Gerar Proposta</option>
          </select>

          <select 
            className="priority-select"
            value={data.priority} 
            onChange={(e) => handlePriorityChange(e.target.value as CasePriority)}
            disabled={updating}
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </div>

      <div className="detail-grid">
        <div className="left-column">
          <div className="card">
            <h3 className="card-title"><User size={18} /> Resumo do Lead</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Email</label>
                <span>{data.lead?.email}</span>
              </div>
              <div className="info-item">
                <label>Telefone</label>
                <span>{data.lead?.phone}</span>
              </div>
              <div className="info-item">
                <label>Tipo de Lead</label>
                <span>{data.lead?.lead_type}</span>
              </div>
              <div className="info-item">
                <label>Origem</label>
                <span>{data.lead?.utm_source || 'Direto'}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title"><Gavel size={18} /> Dados do Ativo ({data.asset_type})</h3>
            
            {data.asset_type === 'trabalhista' ? (
              <div className="info-grid">
                <div className="info-item">
                   <label>Nº do Processo</label>
                   <span>{data.process_number}</span>
                </div>
                <div className="info-item">
                   <label>Tribunal</label>
                   <span>{data.tribunal}</span>
                </div>
                <div className="info-item">
                   <label>Empresa Ré</label>
                   {isEditing ? (
                     <input 
                       className="edit-input" 
                       value={editData.defendant_company || ''} 
                       onChange={(e) => setEditData({...editData, defendant_company: e.target.value})}
                     />
                   ) : (
                     <span>{data.defendant_company}</span>
                   )}
                </div>
                <div className="info-item">
                   <label>Valor Estimado</label>
                   {isEditing ? (
                     <input 
                       className="edit-input" 
                       type="number"
                       value={editData.estimated_value || 0} 
                       onChange={(e) => setEditData({...editData, estimated_value: parseFloat(e.target.value)})}
                     />
                   ) : (
                     <span>R$ {data.estimated_value?.toLocaleString('pt-BR')}</span>
                   )}
                </div>
                <div className="info-item">
                   <label>Fase Processual</label>
                   {isEditing ? (
                     <input 
                       className="edit-input" 
                       value={editData.process_stage || ''} 
                       onChange={(e) => setEditData({...editData, process_stage: e.target.value})}
                     />
                   ) : (
                     <span>{data.process_stage}</span>
                   )}
                </div>
              </div>
            ) : (
              <div className="info-grid">
                <div className="info-item">
                   <label>Nº do Precatório</label>
                   <span>{data.precatorio_number}</span>
                </div>
                <div className="info-item">
                   <label>Ente Público</label>
                   {isEditing ? (
                     <input 
                       className="edit-input" 
                       value={editData.public_entity || ''} 
                       onChange={(e) => setEditData({...editData, public_entity: e.target.value})}
                     />
                   ) : (
                     <span>{data.public_entity}</span>
                   )}
                </div>
                <div className="info-item">
                   <label>Natureza</label>
                   {isEditing ? (
                     <select 
                        className="edit-input"
                        value={editData.credit_nature}
                        onChange={(e) => setEditData({...editData, credit_nature: e.target.value})}
                     >
                        <option value="alimentar">Alimentar</option>
                        <option value="comum">Comum</option>
                        <option value="outro">Outro</option>
                     </select>
                   ) : (
                     <span>{data.credit_nature}</span>
                   )}
                </div>
                <div className="info-item">
                   <label>Ano Pagamento</label>
                   {isEditing ? (
                     <input 
                       className="edit-input" 
                       type="number"
                       value={editData.payment_year || ''} 
                       onChange={(e) => setEditData({...editData, payment_year: parseInt(e.target.value)})}
                     />
                   ) : (
                     <span>{data.payment_year}</span>
                   )}
                </div>
                <div className="info-item">
                   <label>Valor Face</label>
                   {isEditing ? (
                     <input 
                       className="edit-input" 
                       type="number"
                       value={editData.estimated_face_value || 0} 
                       onChange={(e) => setEditData({...editData, estimated_face_value: parseFloat(e.target.value)})}
                     />
                   ) : (
                     <span>R$ {data.estimated_face_value?.toLocaleString('pt-BR')}</span>
                   )}
                </div>
                <div className="info-item">
                   <label>Advogado</label>
                   {isEditing ? (
                     <input 
                       className="edit-input" 
                       value={editData.lawyer_name || ''} 
                       onChange={(e) => setEditData({...editData, lawyer_name: e.target.value})}
                     />
                   ) : (
                     <span>{data.lawyer_name || 'Não inf.'}</span>
                   )}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="card-title"><ShieldCheck size={18} /> Análise e Inteligência</h3>
            <div className="analysis-summary">
              <div className="score-badge">
                 <span className="score-val">{data.score_total || '--'}</span>
                 <span className="score-lab">Score Agile</span>
              </div>
              <div className="analysis-text">
                <h4>Sumário AI</h4>
                <p>{data.ai_summary || 'Nenhuma análise processada ainda.'}</p>
              </div>
            </div>
            <div className="metrics-row">
               <div className="metric">
                  <label>Risco</label>
                  <span className={`risk-${data.risk_level?.toLowerCase()}`}>{data.risk_level || 'Pendente'}</span>
               </div>
               <div className="metric">
                  <label>Solvência</label>
                  <span>{data.solvency_level || 'N/A'}</span>
               </div>
            </div>
          </div>
        </div>

        <div className="right-column">
          <div className="card">
            <h3 className="card-title"><History size={18} /> Histórico de Atividade</h3>
            <div className="timeline">
              {logs.length === 0 ? (
                <p className="empty">Sem histórico disponível.</p>
              ) : logs.map(log => (
                <div className="log-item" key={log.id}>
                  <div className="log-dot" />
                  <div className="log-content">
                    <p>{log.description}</p>
                    <span>{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title"><FileText size={18} /> Documentos</h3>
            {documents.length === 0 ? (
              <p className="empty">Nenhum documento anexado.</p>
            ) : (
              <div className="document-list">
                {documents.map(doc => (
                  <div key={doc.id} className="doc-item">
                    <div className="doc-info">
                      <strong>{doc.document_type || 'Documento'}</strong>
                      <span>{doc.file_name}</span>
                    </div>
                    <div className="doc-actions">
                      <span className={`file-status status-${doc.file_status}`}>{doc.file_status}</span>
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn-view">Ver</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .detail-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .nav-header {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-weight: 500;
          transition: 0.2s;
        }

        .back-btn:hover { color: var(--text); }

        .header-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .ref { font-family: monospace; color: var(--primary); font-weight: 600; }

        .header-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 1rem;
        }

        .h1 { font-size: 2rem; }

        .lead-badges {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .action-buttons {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .btn-edit {
          background: transparent;
          border: 1px solid var(--primary);
          color: var(--primary);
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          font-weight: 700;
          transition: 0.2s;
        }

        .btn-edit:hover {
          background: rgba(194, 161, 95, 0.1);
        }

        .btn-edit.active {
          background: var(--success);
          border-color: var(--success);
          color: white;
        }

        .edit-input {
          width: 100%;
          background: var(--surface-light);
          border: 1px solid var(--border);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          color: var(--text);
          outline: none;
          font-size: 0.875rem;
        }

        .action-buttons select {
          background: var(--primary);
          color: var(--background);
          border: none;
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          font-weight: 700;
          outline: none;
        }

        .priority-select {
          background: var(--surface) !important;
          color: var(--text) !important;
          border: 1px solid var(--border) !important;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 2fr 1.2fr;
          gap: 1.5rem;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1rem;
          margin-bottom: 1.5rem;
          color: var(--primary);
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .info-item label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }

        .info-item span { font-weight: 500; }

        .analysis-summary {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .score-badge {
          background: var(--surface-light);
          padding: 1rem;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 100px;
          border: 1px solid var(--border);
        }

        .score-val { font-size: 1.5rem; font-weight: 800; color: var(--primary); }
        .score-lab { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }

        .analysis-text h4 { font-size: 0.875rem; margin-bottom: 0.5rem; }
        .analysis-text p { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }

        .metrics-row { display: flex; gap: 2rem; padding-top: 1rem; border-top: 1px solid var(--border); }
        .metric label { font-size: 0.75rem; color: var(--text-muted); display: block; }
        
        .risk-baixa { color: var(--success); font-weight: bold; }
        .risk-media { color: var(--warning); font-weight: bold; }
        .risk-alta { color: var(--error); font-weight: bold; }

        .timeline {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: relative;
        }

        .log-item {
          display: flex;
          gap: 1rem;
          position: relative;
        }

        .log-dot {
          width: 8px;
          height: 8px;
          background: var(--primary);
          border-radius: 50%;
          margin-top: 5px;
          flex-shrink: 0;
        }

        .log-content p { font-size: 0.875rem; }
        .log-content span { font-size: 0.75rem; color: var(--text-muted); }

        .empty { color: var(--text-muted); font-size: 0.875rem; text-align: center; }

        .priority-tag {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .priority-tag.premium { color: var(--primary); }
        .priority-tag.alta { color: #ef4444; }
        .priority-tag.media { color: #f59e0b; }
        .priority-tag.baixa { color: #10b981; }

        .asset-tag {
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.05);
          text-transform: capitalize;
        }

        .type-trabalhista { color: var(--primary); }
        .type-precatorio { color: #3b82f6; }

        .document-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .doc-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .doc-info strong { display: block; font-size: 0.875rem; }
        .doc-info span { font-size: 0.75rem; color: var(--text-muted); }

        .doc-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .file-status {
          font-size: 0.7rem;
          text-transform: uppercase;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .status-validado { color: var(--success); background: rgba(16, 185, 129, 0.1); }
        .status-pendente { color: var(--warning); background: rgba(245, 158, 11, 0.1); }
        .status-ilegivel { color: var(--error); background: rgba(239, 68, 68, 0.1); }

        .btn-view {
          font-size: 0.75rem;
          color: var(--primary);
          font-weight: 700;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
