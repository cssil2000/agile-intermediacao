'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Case } from '@/types';
import { 
  Clock, 
  ExternalLink,
  Search,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function HumanReviewPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  async function fetchCases() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*, lead:leads(*)')
        .eq('case_status', 'revisao_humana')
        .order('created_at', { ascending: false });

      if (data) setCases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredCases = cases.filter(c => 
    c.lead?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.process_number?.toLowerCase().includes(search.toLowerCase()) ||
    c.internal_reference?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="list-container">
      <div className="section-header">
        <h1 className="title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={28} color="#f59e0b" /> Revisão Humana
        </h1>
        <div className="actions">
          <button className="btn-secondary" onClick={fetchCases}>Atualizar</button>
        </div>
      </div>

      <div className="card filters-card" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div className="search-bar" style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8d9596' }} />
          <input 
            type="text" 
            placeholder="Pesquisar registros em revisão..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', background: '#1a2a35', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', color: '#fff', outline: 'none' }}
          />
        </div>
        <div className="stats-indicator" style={{ fontSize: '0.875rem', color: '#8d9596' }}>
          {filteredCases.length} registros aguardando
        </div>
      </div>

      <div className="card table-card">
        <table className="table">
          <thead>
            <tr>
              <th>Referência</th>
              <th>Lead</th>
              <th>Ativo</th>
              <th>Doc / Tribunal</th>
              <th>Prioridade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>Carregando...</td></tr>
            ) : filteredCases.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#8d9596' }}>
                    <AlertCircle size={40} opacity={0.3} />
                    <p>Nenhum registro requer revisão humana no momento.</p>
                  </div>
                </td>
              </tr>
            ) : filteredCases.map(item => (
              <tr key={item.id}>
                <td style={{ color: '#c2a15f', fontWeight: 600, fontFamily: 'monospace' }}>{item.internal_reference}</td>
                <td>
                  <div className="lead-cell">
                    <strong>{item.lead?.full_name}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#8d9596' }}>{item.lead?.email}</span>
                  </div>
                </td>
                <td>
                   <span className={`asset-tag type-${item.asset_type}`} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: item.asset_type === 'trabalhista' ? '#c2a15f' : '#3b82f6' }}>
                    {item.asset_type}
                  </span>
                </td>
                <td>
                  <div className="process-cell">
                    <strong>{item.process_number || item.precatorio_number}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#8d9596' }}>{item.tribunal || item.court_origin || 'Local não inf.'}</span>
                  </div>
                </td>
                <td>
                   <span className={`priority-tag ${item.priority}`} style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: item.priority === 'alta' ? '#ef4444' : item.priority === 'media' ? '#f59e0b' : '#10b981' }}>
                      {item.priority}
                    </span>
                </td>
                <td>
                  <Link href={`/admin/oportunidades/${item.id}`} className="btn-icon" style={{ color: '#8d9596' }}>
                    <ExternalLink size={18} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .list-container { display: flex; flex-direction: column; gap: 1.5rem; }
        .section-header { display: flex; justify-content: space-between; align-items: center; }
        .card { background: #121d26; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
        .btn-secondary { background: #1a2a35; border: 1px solid rgba(255,255,255,0.1); padding: 0.5rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; color: #fff; cursor: pointer; }
        .table { width: 100%; border-collapse: collapse; }
        .table th { text-align: left; padding: 1rem 1.5rem; color: #8d9596; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .table td { padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .lead-cell strong, .process-cell strong { display: block; }
      `}</style>
    </div>
  );
}
