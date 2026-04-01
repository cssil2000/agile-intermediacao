'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Case, CaseStatus, CasePriority, AssetType } from '@/types';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  MoreHorizontal,
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function OportunidadesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    asset_type: 'all',
    status: 'all',
    priority: 'all',
    tribunal: 'all',
    value_range: 'all'
  });

  useEffect(() => {
    fetchCases();
  }, []);

  async function fetchCases() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*, lead:leads(*)')
        .order('created_at', { ascending: false });

      if (data) setCases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const tribunals = useMemo(() => {
    const list = new Set<string>();
    cases.forEach(c => {
      const val = c.asset_type === 'trabalhista' ? c.tribunal : c.court_origin;
      if (val) list.add(val);
    });
    return Array.from(list).sort();
  }, [cases]);

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchesSearch = 
        c.process_number?.toLowerCase().includes(search.toLowerCase()) ||
        c.precatorio_number?.toLowerCase().includes(search.toLowerCase()) ||
        c.lead?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.internal_reference?.toLowerCase().includes(search.toLowerCase());
      
      const matchesAsset = filters.asset_type === 'all' || c.asset_type === filters.asset_type;
      const matchesStatus = filters.status === 'all' || c.case_status === filters.status;
      const matchesPriority = filters.priority === 'all' || c.priority === filters.priority;
      
      const currentTribunal = c.asset_type === 'trabalhista' ? c.tribunal : c.court_origin;
      const matchesTribunal = filters.tribunal === 'all' || currentTribunal === filters.tribunal;

      const val = c.asset_type === 'trabalhista' ? (c.estimated_value || 0) : (c.estimated_face_value || 0);
      let matchesValue = true;
      if (filters.value_range === '< 50k') matchesValue = val < 50000;
      else if (filters.value_range === '50k - 200k') matchesValue = val >= 50000 && val <= 200000;
      else if (filters.value_range === '200k - 500k') matchesValue = val > 200000 && val <= 500000;
      else if (filters.value_range === '> 500k') matchesValue = val > 500000;

      return matchesSearch && matchesAsset && matchesStatus && matchesPriority && matchesTribunal && matchesValue;
    });
  }, [cases, search, filters]);

  return (
    <div className="list-container">
      <div className="section-header">
        <h1 className="title">Oportunidades</h1>
        <div className="actions">
          <button className="btn-secondary" onClick={fetchCases}>Atualizar</button>
        </div>
      </div>

      <div className="card filters-card">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Pesquisar por nome, processo ou referência..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <select 
            value={filters.asset_type} 
            onChange={(e) => setFilters({...filters, asset_type: e.target.value})}
          >
            <option value="all">Todos Ativos</option>
            <option value="trabalhista">Trabalhista</option>
            <option value="precatorio">Precatório</option>
          </select>

          <select 
            value={filters.status} 
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">Todos Estados</option>
            <option value="recebido">Recebido</option>
            <option value="em_analise">Em Análise</option>
            <option value="revisao_humana">Revisão Humana</option>
            <option value="aprovado">Aprovado</option>
          </select>

          <select 
            value={filters.priority} 
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
          >
            <option value="all">Todas Prioridades</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="premium">Premium</option>
          </select>

          <select 
            value={filters.tribunal} 
            onChange={(e) => setFilters({...filters, tribunal: e.target.value})}
          >
             <option value="all">Todos Tribunais</option>
             {tribunals.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select 
            value={filters.value_range} 
            onChange={(e) => setFilters({...filters, value_range: e.target.value})}
          >
             <option value="all">Todos Valores</option>
             <option value="< 50k">&lt; R$ 50k</option>
             <option value="50k - 200k">R$ 50k - 200k</option>
             <option value="200k - 500k">R$ 200k - 500k</option>
             <option value="> 500k">&gt; R$ 500k</option>
          </select>
        </div>
      </div>

      <div className="card table-card">
        <table className="table">
          <thead>
            <tr>
              <th>Referência <ArrowUpDown size={14} /></th>
              <th>Lead</th>
              <th>Ativo</th>
              <th>Doc / Tribunal</th>
              <th>Valor Est.</th>
              <th>Estado</th>
              <th>Prioridade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center' }}>Carregando...</td></tr>
            ) : filteredCases.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center' }}>Nenhum resultado encontrado.</td></tr>
            ) : filteredCases.map(item => (
              <tr key={item.id}>
                <td className="ref-cell">{item.internal_reference}</td>
                <td>
                  <div className="lead-cell">
                    <strong>{item.lead?.name}</strong>
                    <span>{item.lead?.email}</span>
                  </div>
                </td>
                <td>
                  <span className={`asset-tag type-${item.asset_type}`}>
                    {item.asset_type}
                  </span>
                </td>
                <td>
                  <div className="process-cell">
                    <strong>{item.process_number || item.precatorio_number}</strong>
                    <span>{item.tribunal || item.court_origin || 'Local não inf.'}</span>
                  </div>
                </td>
                <td className="value-cell">
                  R$ {(item.estimated_value || item.estimated_face_value || 0).toLocaleString('pt-BR')}
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
                  <Link href={`/admin/oportunidades/${item.id}`} className="btn-icon">
                    <ExternalLink size={18} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .list-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .filters-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
        }

        .search-bar {
          position: relative;
          width: 300px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-bar input {
          width: 100%;
          background: var(--surface-light);
          border: 1px solid var(--border);
          padding: 0.6rem 1rem 0.6rem 2.5rem;
          border-radius: 8px;
          color: var(--text);
          outline: none;
        }

        .filter-group {
          display: flex;
          gap: 1rem;
        }

        .filter-group select {
          background: var(--surface-light);
          border: 1px solid var(--border);
          padding: 0.6rem 1rem;
          border-radius: 8px;
          color: var(--text);
          outline: none;
          font-size: 0.875rem;
        }

        .ref-cell {
          font-family: monospace;
          color: var(--primary);
          font-weight: 600;
        }

        .lead-cell strong {
          display: block;
        }

        .lead-cell span {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .process-cell strong {
          display: block;
        }

        .process-cell span {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .value-cell {
          font-weight: 600;
        }

        .btn-icon {
          color: var(--text-muted);
          transition: 0.2s;
        }

        .btn-icon:hover {
          color: var(--primary);
        }

        .btn-secondary {
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 0.5rem 1.25rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          transition: 0.2s;
        }

        .btn-secondary:hover {
          background: var(--surface-light);
          border-color: var(--text-muted);
        }

        .asset-tag {
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.05);
          text-transform: capitalize;
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
      `}</style>
    </div>
  );
}
