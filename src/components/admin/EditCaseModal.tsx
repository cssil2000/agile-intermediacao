'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Case } from '@/types';
import { X, Save, Loader2, Pencil } from 'lucide-react';

interface EditCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  caseData: Case | null;
}

export default function EditCaseModal({ isOpen, onClose, onSaved, caseData }: EditCaseModalProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    process_number: '',
    tribunal: '',
    court_origin: '',
    defendant_company: '',
    public_entity: '',
    estimated_value: '',
    estimated_face_value: '',
    process_stage: '',
    case_status: '',
    priority: '',
    precatorio_number: '',
    credit_nature: '',
    payment_year: '',
    // Lead fields
    lead_full_name: '',
    lead_email: '',
    lead_phone: '',
  });

  useEffect(() => {
    if (caseData) {
      setForm({
        process_number: caseData.process_number || '',
        tribunal: caseData.tribunal || '',
        court_origin: caseData.court_origin || '',
        defendant_company: caseData.defendant_company || '',
        public_entity: caseData.public_entity || '',
        estimated_value: caseData.estimated_value?.toString() || '',
        estimated_face_value: caseData.estimated_face_value?.toString() || '',
        process_stage: caseData.process_stage || '',
        case_status: caseData.case_status || 'recebido',
        priority: caseData.priority || 'media',
        precatorio_number: caseData.precatorio_number || '',
        credit_nature: caseData.credit_nature || '',
        payment_year: caseData.payment_year?.toString() || '',
        lead_full_name: caseData.lead?.full_name || '',
        lead_email: caseData.lead?.email || '',
        lead_phone: caseData.lead?.phone || '',
      });
    }
  }, [caseData]);

  if (!isOpen || !caseData) return null;

  const isTrabalhista = caseData.asset_type === 'trabalhista';

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update case
      const caseUpdate: any = {
        process_number: form.process_number || null,
        case_status: form.case_status,
        priority: form.priority,
        process_stage: form.process_stage || null,
      };

      if (isTrabalhista) {
        caseUpdate.tribunal = form.tribunal || null;
        caseUpdate.defendant_company = form.defendant_company || null;
        caseUpdate.estimated_value = form.estimated_value ? parseFloat(form.estimated_value) : null;
      } else {
        caseUpdate.court_origin = form.court_origin || null;
        caseUpdate.public_entity = form.public_entity || null;
        caseUpdate.estimated_face_value = form.estimated_face_value ? parseFloat(form.estimated_face_value) : null;
        caseUpdate.precatorio_number = form.precatorio_number || null;
        caseUpdate.credit_nature = form.credit_nature || null;
        caseUpdate.payment_year = form.payment_year ? parseInt(form.payment_year) : null;
      }

      const { error: caseError } = await supabase
        .from('cases')
        .update(caseUpdate)
        .eq('id', caseData.id);

      if (caseError) throw caseError;

      // Update lead if exists
      if (caseData.lead_id) {
        const { error: leadError } = await supabase
          .from('leads')
          .update({
            full_name: form.lead_full_name,
            email: form.lead_email,
            phone: form.lead_phone,
          })
          .eq('id', caseData.lead_id);

        if (leadError) throw leadError;
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        case_id: caseData.id,
        event_type: 'edicao_admin',
        description: `Caso editado pelo admin via painel.`,
        actor_type: 'admin'
      });

      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Pencil size={20} className="pencil-icon" />
            <h2>Editar Caso</h2>
            <span className={`asset-tag type-${caseData.asset_type}`}>
              {isTrabalhista ? 'Trabalhista' : 'Precatório'}
            </span>
          </div>
          <span className="ref-badge">#{caseData.internal_reference}</span>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Lead Info Section */}
          <div className="form-section">
            <h3>Dados do Cliente</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Nome Completo</label>
                <input
                  type="text"
                  value={form.lead_full_name}
                  onChange={(e) => updateField('lead_full_name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.lead_email}
                  onChange={(e) => updateField('lead_email', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Telefone</label>
                <input
                  type="text"
                  value={form.lead_phone}
                  onChange={(e) => updateField('lead_phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Case Info Section */}
          <div className="form-section">
            <h3>Dados do Processo</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Nº do Processo</label>
                <input
                  type="text"
                  value={form.process_number}
                  onChange={(e) => updateField('process_number', e.target.value)}
                />
              </div>

              {isTrabalhista ? (
                <>
                  <div className="form-group">
                    <label>Tribunal / TRT</label>
                    <input
                      type="text"
                      value={form.tribunal}
                      onChange={(e) => updateField('tribunal', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Reclamada (Empresa)</label>
                    <input
                      type="text"
                      value={form.defendant_company}
                      onChange={(e) => updateField('defendant_company', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Valor Estimado (R$)</label>
                    <input
                      type="number"
                      value={form.estimated_value}
                      onChange={(e) => updateField('estimated_value', e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Nº do Precatório</label>
                    <input
                      type="text"
                      value={form.precatorio_number}
                      onChange={(e) => updateField('precatorio_number', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tribunal de Origem</label>
                    <input
                      type="text"
                      value={form.court_origin}
                      onChange={(e) => updateField('court_origin', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ente Público</label>
                    <input
                      type="text"
                      value={form.public_entity}
                      onChange={(e) => updateField('public_entity', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Valor de Face (R$)</label>
                    <input
                      type="number"
                      value={form.estimated_face_value}
                      onChange={(e) => updateField('estimated_face_value', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Natureza do Crédito</label>
                    <select value={form.credit_nature} onChange={(e) => updateField('credit_nature', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="alimentar">Alimentar</option>
                      <option value="comum">Comum</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ano Previsão Pagamento</label>
                    <input
                      type="number"
                      value={form.payment_year}
                      onChange={(e) => updateField('payment_year', e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Fase Processual</label>
                <input
                  type="text"
                  value={form.process_stage}
                  onChange={(e) => updateField('process_stage', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Management Section */}
          <div className="form-section">
            <h3>Gestão</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Status</label>
                <select value={form.case_status} onChange={(e) => updateField('case_status', e.target.value)}>
                  <option value="recebido">Recebido</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="revisao_humana">Revisão Humana</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="rejeitado">Rejeitado</option>
                  <option value="proposta">Proposta Enviada</option>
                  <option value="encerrado">Encerrado</option>
                </select>
              </div>
              <div className="form-group">
                <label>Prioridade</label>
                <select value={form.priority} onChange={(e) => updateField('priority', e.target.value)}>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="premium">Premium / VIP</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
          padding: 2rem;
        }

        .modal-content {
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          max-width: 680px;
          width: 100%;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          position: relative;
          animation: slideUp 0.3s ease;
        }

        .modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          position: relative;
        }

        .modal-title-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .modal-title-row :global(.pencil-icon) {
          color: #c2a15f;
        }

        h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
        }

        .ref-badge {
          font-size: 0.75rem;
          color: #c2a15f;
          font-weight: 600;
          margin-top: 0.25rem;
          font-family: monospace;
        }

        .asset-tag {
          font-size: 0.7rem;
          padding: 3px 10px;
          border-radius: 6px;
          font-weight: 600;
        }

        .type-trabalhista { background: rgba(194,161,95,0.1); color: #c2a15f; }
        .type-precatorio { background: rgba(59,130,246,0.1); color: #3b82f6; }

        .modal-close {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          color: #8d9596;
          padding: 0.5rem;
          border-radius: 8px;
          transition: 0.2s;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .modal-body {
          padding: 1.5rem 2rem;
          overflow-y: auto;
          flex: 1;
        }

        .form-section {
          margin-bottom: 1.75rem;
        }

        .form-section:last-child {
          margin-bottom: 0;
        }

        h3 {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #c2a15f;
          font-weight: 700;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(194, 161, 95, 0.15);
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-group label {
          font-size: 0.75rem;
          color: #8d9596;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .form-group input,
        .form-group select {
          background: #0d0d0d;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 0.65rem 0.85rem;
          color: #fff;
          font-size: 0.9rem;
          outline: none;
          transition: 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          border-color: #c2a15f;
          box-shadow: 0 0 0 2px rgba(194, 161, 95, 0.1);
        }

        .modal-footer {
          padding: 1.25rem 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn-cancel {
          padding: 0.7rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.875rem;
          background: rgba(255, 255, 255, 0.05);
          color: #8d9596;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: 0.2s;
        }

        .btn-cancel:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .btn-save {
          padding: 0.7rem 1.5rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.875rem;
          background: #c2a15f;
          color: #000;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: 0.2s;
        }

        .btn-save:hover:not(:disabled) {
          background: #a68a51;
          transform: translateY(-1px);
        }

        .btn-save:disabled,
        .btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        :global(.animate-spin) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
