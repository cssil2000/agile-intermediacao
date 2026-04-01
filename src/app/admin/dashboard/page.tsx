'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Case, LeadType } from '@/types';
import { 
  TrendingUp, 
  Briefcase, 
  CheckCircle, 
  XCircle, 
  Scale, 
  FileText,
  Clock,
  Zap
} from 'lucide-react';
import Link from 'next/link';

const KPICard = ({ icon: Icon, title, value, color, loading }: any) => (
  <div className="card kpi-card">
    <div className="kpi-icon" style={{ backgroundColor: `${color}15`, color: color }}>
      <Icon size={24} />
    </div>
    <div className="kpi-info">
      <span className="kpi-label">{title}</span>
      <h3 className="kpi-value">{loading ? '...' : value}</h3>
    </div>
    <style jsx>{`
      .kpi-card {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        padding: 1.25rem;
      }
      .kpi-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .kpi-info {
        display: flex;
        flex-direction: column;
      }
      .kpi-label {
        color: var(--text-muted);
        font-size: 0.815rem;
        font-weight: 500;
      }
      .kpi-value {
        font-size: 1.25rem;
        font-weight: 700;
        margin-top: 0.25rem;
      }
    `}</style>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeCases: 0,
    humanReview: 0,
    approved: 0,
    rejected: 0,
    trabalhista: 0,
    precatorio: 0
  });
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [assetFilter, setAssetFilter] = useState<'all' | 'trabalhista' | 'precatorio'>('all');

  useEffect(() => {
    fetchDashboardData();
  }, [assetFilter]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      let query = supabase.from('cases').select('*, lead:leads(*)');
      
      if (assetFilter !== 'all') {
        query = query.eq('asset_type', assetFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (data) {
        const statsObj = {
          totalLeads: data.length,
          activeCases: data.filter(c => c.case_status === 'em_analise').length,
          humanReview: data.filter(c => c.case_status === 'revisao_humana').length,
          approved: data.filter(c => c.case_status === 'aprovado').length,
          rejected: data.filter(c => c.case_status === 'rejeitado').length,
          trabalhista: data.filter(c => c.asset_type === 'trabalhista').length,
          precatorio: data.filter(c => c.asset_type === 'precatorio').length
        };
        setStats(statsObj);
        setRecentCases(data.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-container">
      <div className="section-header">
        <h1 className="title">Dashboard</h1>
        <div className="asset-tabs">
          <button 
            className={`tab ${assetFilter === 'all' ? 'active' : ''}`}
            onClick={() => setAssetFilter('all')}
          >
            Todos Ativos
          </button>
          <button 
            className={`tab ${assetFilter === 'trabalhista' ? 'active' : ''}`}
            onClick={() => setAssetFilter('trabalhista')}
          >
            Trabalhista
          </button>
          <button 
            className={`tab ${assetFilter === 'precatorio' ? 'active' : ''}`}
            onClick={() => setAssetFilter('precatorio')}
          >
            Precatórios
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPICard 
          icon={TrendingUp} 
          title="Total Oportunidades" 
          value={stats.totalLeads} 
          color="#c2a15f" 
          loading={loading} 
        />
        <KPICard 
          icon={Clock} 
          title="Em Análise" 
          value={stats.activeCases} 
          color="#3b82f6" 
          loading={loading} 
        />
        <KPICard 
          icon={Scale} 
          title="Revisão Humana" 
          value={stats.humanReview} 
          color="#f59e0b" 
          loading={loading} 
        />
        <KPICard 
          icon={CheckCircle} 
          title="Aprovados" 
          value={stats.approved} 
          color="#10b981" 
          loading={loading} 
        />
      </div>

      <div className="dashboard-grid">
        <div className="card recent-cases-section">
          <div className="card-header">
            <h3>Recentemente Recebidos</h3>
            <Link href="/admin/oportunidades" className="view-all">Ver tudo</Link>
          </div>
          
          <table className="table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Ativo</th>
                <th>Doc/Processo</th>
                <th>Estado</th>
                <th>Prioridade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>Carregando dados...</td></tr>
              ) : recentCases.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>Nenhuma oportunidade encontrada.</td></tr>
              ) : recentCases.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="lead-cell">
                      <strong>{item.lead?.name || 'N/A'}</strong>
                      <span>{item.lead?.lead_type}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`asset-tag type-${item.asset_type}`}>
                      {item.asset_type === 'trabalhista' ? 'Trabalhista' : 'Precatório'}
                    </span>
                  </td>
                  <td>
                    <div className="process-cell">
                      <span>{item.process_number || item.precatorio_number || 'Sem número'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-status-${item.case_status}`}>
                      {item.case_status}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-tag ${item.priority}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/oportunidades/${item.id}`} className="btn-small">Abrir</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card sidebar-stats">
          <h3>Distribuição</h3>
          <div className="dist-chart">
            <div className="dist-item">
              <div className="dist-label">
                <span>Trabalhista</span>
                <span>{stats.trabalhista}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(stats.trabalhista / (stats.totalLeads || 1)) * 100}%`, backgroundColor: '#c2a15f' }} 
                />
              </div>
            </div>
            <div className="dist-item">
              <div className="dist-label">
                <span>Precatórios</span>
                <span>{stats.precatorio}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(stats.precatorio / (stats.totalLeads || 1)) * 100}%`, backgroundColor: '#3b82f6' }} 
                />
              </div>
            </div>
          </div>

          <div className="alerts-section">
            <h4>Alertas de Hoje</h4>
            <div className="alert-item">
              <Zap size={16} color="#c2a15f" />
              <span>3 Oportunidades Premium pendentes</span>
            </div>
            <div className="alert-item">
              <Scale size={16} color="#f59e0b" />
              <span>5 Revisões humanas aguardando</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .asset-tabs {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 3px;
          display: flex;
        }

        .tab {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .tab.active {
          background: var(--surface-light);
          color: var(--primary);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .view-all {
          color: var(--primary);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .lead-cell {
          display: flex;
          flex-direction: column;
        }

        .lead-cell span {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: capitalize;
        }

        .asset-tag {
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.05);
        }

        .type-trabalhista { color: var(--primary); }
        .type-precatorio { color: #3b82f6; }

        .priority-tag {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .priority-tag.premium { color: var(--primary); }
        .priority-tag.alta { color: #ef4444; }
        .priority-tag.media { color: #f59e0b; }
        .priority-tag.baixa { color: #10b981; }

        .btn-small {
          background: var(--surface-light);
          border: 1px solid var(--border);
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 0.75rem;
          transition: 0.2s;
        }

        .btn-small:hover {
          background: var(--primary);
          color: var(--background);
          border-color: var(--primary);
        }

        .dist-chart {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .dist-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          color: var(--text-muted);
        }

        .progress-bar {
          height: 6px;
          background: var(--surface-light);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 3px;
        }

        .alerts-section {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }

        .alerts-section h4 {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }

        .alert-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
        }
      `}</style>
    </div>
  );
}
