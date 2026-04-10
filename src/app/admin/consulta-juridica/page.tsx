'use client';

import React, { useState, useRef } from 'react';
import {
  Search, Loader2, AlertCircle, ChevronDown, ChevronUp,
  FileText, Clock, Building2, User, Scale, Hash,
  Calendar, Layers, ArrowRight, X, History, ExternalLink,
  RefreshCw, Copy, CheckCheck, Download
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchType = 'cnj' | 'nome' | 'cpf';

interface SearchHistoryItem {
  type: SearchType;
  query: string;
  resultCount: number;
  timestamp: Date;
}

interface ProcessResult {
  id?: number;
  numero_cnj?: string;
  titulo_polo_ativo?: string;
  titulo_polo_passivo?: string;
  tribunal?: { nome?: string; sigla?: string } | string;
  data_ultima_movimentacao?: string;
  quantidade_movimentacoes?: number;
  quantidade_fontes?: number;
  fontes?: any[];
  movimentacoes?: Array<{ data?: string; titulo?: string; conteudo?: string; tipo?: string }>;
  status?: string;
  assunto?: string;
  valor_causa?: number;
  data_inicio?: string;
  [key: string]: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const maskCNJ = (value: string) => {
  const d = value.replace(/\D/g, '');
  if (d.length <= 7) return d;
  if (d.length <= 9) return `${d.slice(0, 7)}-${d.slice(7, 9)}`;
  if (d.length <= 13) return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}`;
  if (d.length <= 14) return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}`;
  if (d.length <= 16) return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}`;
  return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16, 20)}`;
};

const maskCPF = (value: string) => {
  const d = value.replace(/\D/g, '');
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch { return dateStr; }
};

const formatCurrency = (val?: number) => {
  if (!val) return null;
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const getTribunalName = (tribunal: any) => {
  if (!tribunal) return '—';
  if (typeof tribunal === 'string') return tribunal;
  return tribunal.sigla || tribunal.nome || '—';
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SearchTypeBadge({ type }: { type: SearchType }) {
  const map = { cnj: { label: 'CNJ', color: '#c2a15f' }, nome: { label: 'NOME', color: '#3b82f6' }, cpf: { label: 'CPF', color: '#10b981' } };
  const t = map[type];
  return (
    <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1px', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${t.color}40`, color: t.color, background: `${t.color}10` }}>
      {t.label}
    </span>
  );
}

function ProcessCard({ process, onClick, isSelected }: { process: ProcessResult; onClick: () => void; isSelected: boolean }) {
  const tribunal = getTribunalName(process.tribunal);
  const poloAtivo = process.titulo_polo_ativo || process.polo_ativo || '—';
  const poloPassivo = process.titulo_polo_passivo || process.polo_passivo || '—';
  const lastMove = process.data_ultima_movimentacao || process.data_ultima_atualizacao;

  return (
    <div className={`process-card ${isSelected ? 'selected' : ''}`} onClick={onClick}>
      <div className="card-top">
        <div className="card-cnj">
          <Hash size={13} />
          <span>{process.numero_cnj || 'CNJ não disponível'}</span>
        </div>
        <div className="card-tribunal">
          <Scale size={13} />
          <span>{tribunal}</span>
        </div>
      </div>

      <div className="card-parties">
        <div className="party">
          <User size={12} />
          <div>
            <span className="party-label">POLO ATIVO</span>
            <span className="party-name">{poloAtivo}</span>
          </div>
        </div>
        <ArrowRight size={14} className="party-arrow" />
        <div className="party">
          <Building2 size={12} />
          <div>
            <span className="party-label">POLO PASSIVO</span>
            <span className="party-name">{poloPassivo}</span>
          </div>
        </div>
      </div>

      <div className="card-footer">
        {lastMove && (
          <span className="card-meta"><Calendar size={12} /> {formatDate(lastMove)}</span>
        )}
        {process.quantidade_movimentacoes != null && (
          <span className="card-meta"><Layers size={12} /> {process.quantidade_movimentacoes} movimentações</span>
        )}
        {process.valor_causa && (
          <span className="card-meta gold">{formatCurrency(process.valor_causa)}</span>
        )}
        <span className="card-open">Ver detalhes <ChevronDown size={13} /></span>
      </div>

      <style jsx>{`
        .process-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1.2rem 1.4rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .process-card:hover { border-color: rgba(194,161,95,0.4); background: rgba(194,161,95,0.03); }
        .process-card.selected { border-color: var(--primary); background: rgba(194,161,95,0.05); }
        .card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .card-cnj { display: flex; align-items: center; gap: 0.4rem; font-family: monospace; font-size: 0.85rem; color: var(--primary); font-weight: 600; }
        .card-tribunal { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: var(--text-muted); background: var(--surface-light); padding: 3px 8px; border-radius: 4px; }
        .card-parties { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
        .party { display: flex; align-items: flex-start; gap: 0.5rem; flex: 1; min-width: 0; color: var(--text-muted); }
        .party-label { display: block; font-size: 0.6rem; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 0.15rem; }
        .party-name { display: block; font-size: 0.82rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .party-arrow { color: var(--border); flex-shrink: 0; }
        .card-footer { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .card-meta { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: var(--text-muted); }
        .card-meta.gold { color: var(--primary); font-weight: 600; }
        .card-open { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: var(--primary); margin-left: auto; font-weight: 600; }
      `}</style>
    </div>
  );
}

function ProcessDetail({ process, onClose }: { process: ProcessResult; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [showAllMoves, setShowAllMoves] = useState(false);

  const movimentacoes = process.movimentacoes || [];
  const visibleMoves = showAllMoves ? movimentacoes : movimentacoes.slice(0, 5);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadProcess = () => {
    const tribunal = getTribunalName(process.tribunal);
    const poloAtivo = process.titulo_polo_ativo || process.polo_ativo || '—';
    const poloPassivo = process.titulo_polo_passivo || process.polo_passivo || '—';
    const allMoves = process.movimentacoes || [];
    const fontes = process.fontes || [];
    const geradoEm = new Date().toLocaleString('pt-BR');

    const movesHtml = allMoves.length > 0
      ? allMoves.map(m => `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;color:#6b7280;font-size:13px;vertical-align:top;">${formatDate(m.data)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;vertical-align:top;">
              <strong style="display:block;font-size:13px;color:#111827;margin-bottom:4px;">${m.titulo || m.tipo || 'Movimentação'}</strong>
              ${m.conteudo ? `<span style="font-size:12px;color:#6b7280;line-height:1.5;">${m.conteudo}</span>` : ''}
            </td>
          </tr>`).join('')
      : '<tr><td colspan="2" style="padding:16px;text-align:center;color:#9ca3af;">Sem movimentações registadas</td></tr>';

    const fontesHtml = fontes.length > 0
      ? fontes.map((f: any) => `<li style="margin-bottom:4px;font-size:13px;color:#374151;">${f.nome || f.sigla || f.tribunal?.sigla || JSON.stringify(f)}</li>`).join('')
      : '<li style="font-size:13px;color:#9ca3af;">Nenhuma fonte disponível</li>';

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Processo ${process.numero_cnj || 'Sem CNJ'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
      @page { margin: 2cm; }
    }
    .header { border-bottom: 3px solid #c2a15f; padding-bottom: 24px; margin-bottom: 32px; }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .brand-name { font-size: 13px; font-weight: 700; letter-spacing: 2px; color: #c2a15f; text-transform: uppercase; }
    .brand-sep { width: 1px; height: 20px; background: #e5e7eb; }
    .brand-doc { font-size: 12px; color: #9ca3af; }
    .cnj { font-size: 22px; font-weight: 800; color: #111827; font-family: monospace; margin-bottom: 6px; }
    .tribunal-badge { display: inline-block; background: #f3f4f6; border: 1px solid #e5e7eb; padding: 4px 10px; border-radius: 4px; font-size: 12px; color: #374151; font-weight: 600; }
    .meta-row { display: flex; gap: 24px; margin-top: 16px; flex-wrap: wrap; }
    .meta-item { font-size: 12px; color: #6b7280; }
    .meta-item strong { color: #111827; display: block; font-size: 13px; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #9ca3af; text-transform: uppercase; margin-bottom: 14px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; }
    .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .party-box { background: #f9fafb; border-radius: 8px; padding: 16px; }
    .party-box.ativo { border-left: 4px solid #c2a15f; }
    .party-box.passivo { border-left: 4px solid #3b82f6; }
    .party-role { font-size: 10px; font-weight: 700; letter-spacing: 1px; color: #9ca3af; text-transform: uppercase; margin-bottom: 6px; }
    .party-name { font-size: 15px; font-weight: 700; color: #111827; }
    .data-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .data-field { background: #f9fafb; border-radius: 6px; padding: 12px 14px; }
    .data-label { font-size: 10px; letter-spacing: 1px; color: #9ca3af; text-transform: uppercase; margin-bottom: 4px; }
    .data-value { font-size: 14px; font-weight: 600; color: #111827; }
    .data-value.gold { color: #c2a15f; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f9fafb; padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; letter-spacing: 1px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
    .fontes-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .fonte-item { background: #f9fafb; padding: 8px 12px; border-radius: 6px; font-size: 13px; color: #374151; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
    .footer-text { font-size: 11px; color: #9ca3af; }
    .print-btn { no-print: true; background: #c2a15f; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; margin-bottom: 24px; }
    .print-btn:hover { background: #a8894f; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>

  <div class="header">
    <div class="brand">
      <span class="brand-name">Agile Intermediação</span>
      <span class="brand-sep"></span>
      <span class="brand-doc">Relatório de Processo Judicial</span>
    </div>
    <div class="cnj">${process.numero_cnj || 'CNJ não disponível'}</div>
    <span class="tribunal-badge">${tribunal}</span>
    <div class="meta-row">
      ${process.data_inicio ? `<div class="meta-item"><strong>${formatDate(process.data_inicio)}</strong>Data de Início</div>` : ''}
      ${process.data_ultima_movimentacao ? `<div class="meta-item"><strong>${formatDate(process.data_ultima_movimentacao)}</strong>Última Movimentação</div>` : ''}
      ${process.quantidade_movimentacoes != null ? `<div class="meta-item"><strong>${process.quantidade_movimentacoes}</strong>Movimentações</div>` : ''}
      ${process.valor_causa ? `<div class="meta-item"><strong style="color:#c2a15f;">${formatCurrency(process.valor_causa)}</strong>Valor da Causa</div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Partes do Processo</div>
    <div class="parties-grid">
      <div class="party-box ativo">
        <div class="party-role">Polo Ativo</div>
        <div class="party-name">${poloAtivo}</div>
      </div>
      <div class="party-box passivo">
        <div class="party-role">Polo Passivo</div>
        <div class="party-name">${poloPassivo}</div>
      </div>
    </div>
  </div>

  ${process.assunto || process.status ? `
  <div class="section">
    <div class="section-title">Dados Adicionais</div>
    <div class="data-grid">
      ${process.assunto ? `<div class="data-field" style="grid-column:1/-1"><div class="data-label">Assunto</div><div class="data-value">${process.assunto}</div></div>` : ''}
      ${process.status ? `<div class="data-field"><div class="data-label">Status</div><div class="data-value">${process.status}</div></div>` : ''}
      ${process.quantidade_fontes != null ? `<div class="data-field"><div class="data-label">Instâncias</div><div class="data-value">${process.quantidade_fontes}</div></div>` : ''}
    </div>
  </div>` : ''}

  <div class="section">
    <div class="section-title">Movimentações (${allMoves.length})</div>
    <table>
      <thead><tr><th style="width:110px;">Data</th><th>Descrição</th></tr></thead>
      <tbody>${movesHtml}</tbody>
    </table>
  </div>

  ${fontes.length > 0 ? `
  <div class="section">
    <div class="section-title">Instâncias / Fontes (${fontes.length})</div>
    <ul class="fontes-list">
      ${fontesHtml}
    </ul>
  </div>` : ''}

  <div class="footer">
    <span class="footer-text">Gerado em ${geradoEm} · Fonte: API Escavador v2 · Agile Intermediação</span>
    <span class="footer-text">Documento informativo — não tem valor jurídico oficial</span>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processo-${(process.numero_cnj || 'sem-cnj').replace(/[^\d.-]/g, '')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div>
          <div className="detail-cnj">
            <Hash size={14} />
            <span>{process.numero_cnj || 'CNJ não disponível'}</span>
            <button className="copy-btn" onClick={() => copyText(process.numero_cnj || '')} title="Copiar CNJ">
              {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
            </button>
          </div>
          <p className="detail-tribunal">{getTribunalName(process.tribunal)}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="download-btn" onClick={downloadProcess} title="Download do processo completo">
            <Download size={15} />
            <span>Download</span>
          </button>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>
      </div>

      {/* Partes */}
      <div className="detail-section">
        <h4 className="detail-section-title">PARTES DO PROCESSO</h4>
        <div className="detail-parties">
          <div className="detail-party active-side">
            <span className="party-role">POLO ATIVO</span>
            <strong>{process.titulo_polo_ativo || process.polo_ativo || '—'}</strong>
          </div>
          <div className="detail-party passive-side">
            <span className="party-role">POLO PASSIVO</span>
            <strong>{process.titulo_polo_passivo || process.polo_passivo || '—'}</strong>
          </div>
        </div>
      </div>

      {/* Dados Gerais */}
      <div className="detail-section">
        <h4 className="detail-section-title">DADOS GERAIS</h4>
        <div className="detail-grid">
          {process.data_inicio && (
            <div className="detail-field">
              <span>Data de Início</span>
              <strong>{formatDate(process.data_inicio)}</strong>
            </div>
          )}
          {process.data_ultima_movimentacao && (
            <div className="detail-field">
              <span>Última Movimentação</span>
              <strong>{formatDate(process.data_ultima_movimentacao)}</strong>
            </div>
          )}
          {process.quantidade_movimentacoes != null && (
            <div className="detail-field">
              <span>Total de Movimentações</span>
              <strong>{process.quantidade_movimentacoes}</strong>
            </div>
          )}
          {process.valor_causa && (
            <div className="detail-field">
              <span>Valor da Causa</span>
              <strong className="gold">{formatCurrency(process.valor_causa)}</strong>
            </div>
          )}
          {process.assunto && (
            <div className="detail-field full">
              <span>Assunto</span>
              <strong>{process.assunto}</strong>
            </div>
          )}
          {process.status && (
            <div className="detail-field">
              <span>Status</span>
              <strong>{process.status}</strong>
            </div>
          )}
          {process.quantidade_fontes != null && (
            <div className="detail-field">
              <span>Instâncias / Fontes</span>
              <strong>{process.quantidade_fontes}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Movimentações */}
      {movimentacoes.length > 0 && (
        <div className="detail-section">
          <h4 className="detail-section-title">MOVIMENTAÇÕES RECENTES</h4>
          <div className="moves-list">
            {visibleMoves.map((m, i) => (
              <div key={i} className="move-item">
                <div className="move-date">{formatDate(m.data)}</div>
                <div className="move-body">
                  <strong className="move-title">{m.titulo || m.tipo || 'Movimentação'}</strong>
                  {m.conteudo && (
                    <p className="move-content">{m.conteudo.length > 300 ? m.conteudo.slice(0, 300) + '...' : m.conteudo}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {movimentacoes.length > 5 && (
            <button className="show-more-btn" onClick={() => setShowAllMoves(v => !v)}>
              {showAllMoves ? <><ChevronUp size={14} /> Mostrar menos</> : <><ChevronDown size={14} /> Ver todas as {movimentacoes.length} movimentações</>}
            </button>
          )}
        </div>
      )}

      {/* Fontes */}
      {process.fontes && process.fontes.length > 0 && (
        <div className="detail-section">
          <h4 className="detail-section-title">INSTÂNCIAS / FONTES</h4>
          <div className="fontes-list">
            {process.fontes.slice(0, 6).map((f: any, i: number) => (
              <div key={i} className="fonte-item">
                <Scale size={12} />
                <span>{f.nome || f.sigla || f.tribunal?.sigla || JSON.stringify(f).slice(0, 60)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw JSON para debug */}
      <details className="detail-raw">
        <summary>Dados brutos (JSON)</summary>
        <pre>{JSON.stringify(process, null, 2)}</pre>
      </details>

      <style jsx>{`
        .detail-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }
        .detail-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 1.2rem 1.4rem; background: rgba(194,161,95,0.05);
          border-bottom: 1px solid var(--border);
        }
        .detail-cnj {
          display: flex; align-items: center; gap: 0.5rem;
          font-family: monospace; font-size: 0.95rem; font-weight: 700; color: var(--primary);
        }
        .detail-tribunal { font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem; }
        .copy-btn { color: var(--text-muted); padding: 2px 4px; border-radius: 4px; transition: 0.2s; }
        .copy-btn:hover { color: var(--primary); }
        .download-btn {
          display: flex; align-items: center; gap: 0.4rem;
          background: rgba(194,161,95,0.1); border: 1px solid rgba(194,161,95,0.25);
          color: var(--primary); padding: 6px 12px; border-radius: 6px;
          font-size: 0.78rem; font-weight: 700; transition: 0.2s; cursor: pointer;
        }
        .download-btn:hover { background: rgba(194,161,95,0.2); border-color: var(--primary); }
        .close-btn { color: var(--text-muted); padding: 4px; border-radius: 6px; transition: 0.2s; }
        .close-btn:hover { color: var(--text); background: var(--surface-light); }

        .detail-section { padding: 1.2rem 1.4rem; border-bottom: 1px solid var(--border); }
        .detail-section:last-child { border-bottom: none; }
        .detail-section-title { font-size: 0.62rem; letter-spacing: 2px; color: var(--text-muted); margin-bottom: 1rem; }

        .detail-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .detail-party { background: var(--surface-light); border-radius: 6px; padding: 0.8rem 1rem; }
        .detail-party.active-side { border-left: 3px solid var(--primary); }
        .detail-party.passive-side { border-left: 3px solid #3b82f6; }
        .party-role { display: block; font-size: 0.6rem; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 0.3rem; }
        .detail-party strong { font-size: 0.85rem; color: var(--text); }

        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .detail-field { background: var(--surface-light); border-radius: 6px; padding: 0.75rem 1rem; }
        .detail-field.full { grid-column: 1 / -1; }
        .detail-field span { display: block; font-size: 0.6rem; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 0.3rem; }
        .detail-field strong { font-size: 0.85rem; color: var(--text); }
        .detail-field strong.gold { color: var(--primary); }

        .moves-list { display: flex; flex-direction: column; gap: 0; }
        .move-item { display: grid; grid-template-columns: 80px 1fr; gap: 1rem; padding: 0.9rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .move-item:last-child { border-bottom: none; }
        .move-date { font-size: 0.72rem; color: var(--text-muted); padding-top: 2px; }
        .move-title { font-size: 0.82rem; color: var(--text); display: block; margin-bottom: 0.3rem; }
        .move-content { font-size: 0.75rem; color: var(--text-muted); line-height: 1.5; margin: 0; }
        .show-more-btn { display: flex; align-items: center; gap: 0.4rem; margin-top: 0.75rem; font-size: 0.8rem; color: var(--primary); font-weight: 600; }

        .fontes-list { display: flex; flex-direction: column; gap: 0.4rem; }
        .fonte-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--text-muted); background: var(--surface-light); padding: 0.5rem 0.75rem; border-radius: 6px; }

        .detail-raw { margin-top: 0; }
        .detail-raw summary { padding: 0.75rem 1.4rem; font-size: 0.75rem; color: var(--text-muted); cursor: pointer; }
        .detail-raw pre { background: #0a0a0a; padding: 1rem 1.4rem; font-size: 0.72rem; color: #a0aec0; overflow-x: auto; max-height: 300px; }
      `}</style>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ConsultaJuridicaPage() {
  const [searchType, setSearchType] = useState<SearchType>('cnj');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessResult[] | null>(null);
  const [selected, setSelected] = useState<ProcessResult | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const SEARCH_TYPES = [
    { value: 'cnj' as SearchType, label: 'Número CNJ', placeholder: '0000000-00.0000.0.00.0000', hint: 'Número do processo no formato CNJ padrão' },
    { value: 'nome' as SearchType, label: 'Nome da Parte', placeholder: 'Ex: João da Silva', hint: 'Nome completo do reclamante ou empresa' },
    { value: 'cpf' as SearchType, label: 'CPF / CNPJ', placeholder: '000.000.000-00', hint: 'CPF do trabalhador ou CNPJ da empresa' },
  ];

  const currentType = SEARCH_TYPES.find(t => t.value === searchType)!;

  const handleQueryChange = (value: string) => {
    if (searchType === 'cnj') setQuery(maskCNJ(value));
    else if (searchType === 'cpf') setQuery(maskCPF(value));
    else setQuery(value);
  };

  const handleSearch = async () => {
    if (!query.trim()) { inputRef.current?.focus(); return; }
    setLoading(true);
    setError(null);
    setResults(null);
    setSelected(null);

    try {
      const res = await fetch('/api/admin/consulta-juridica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: searchType, query })
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Nenhum resultado encontrado.');
        setResults([]);
        return;
      }

      setResults(data.items);
      setHistory(prev => [
        { type: searchType, query, resultCount: data.items.length, timestamp: new Date() },
        ...prev.filter(h => !(h.type === searchType && h.query === query)).slice(0, 9)
      ]);
    } catch (err: any) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleHistoryClick = (item: SearchHistoryItem) => {
    setSearchType(item.type);
    setQuery(item.query);
    setResults(null);
    setSelected(null);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setSelected(null);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="consulta-container">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="title">Consulta Jurídica</h1>
          <p className="subtitle">Pesquise processos em tempo real via API do Escavador</p>
        </div>
        {results !== null && (
          <button className="btn-clear" onClick={clearSearch}>
            <RefreshCw size={15} /> Nova consulta
          </button>
        )}
      </div>

      {/* Search Box */}
      <div className="search-card card">

        {/* Tabs de tipo */}
        <div className="search-type-tabs">
          {SEARCH_TYPES.map(t => (
            <button
              key={t.value}
              className={`type-tab ${searchType === t.value ? 'active' : ''}`}
              onClick={() => { setSearchType(t.value); setQuery(''); setError(null); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Input principal */}
        <div className="search-input-area">
          <div className="search-input-wrap">
            <Search size={20} className="search-icon" />
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder={currentType.placeholder}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {query && (
              <button className="input-clear" onClick={() => { setQuery(''); inputRef.current?.focus(); }}>
                <X size={16} />
              </button>
            )}
          </div>
          <button className="search-btn" onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
            {loading ? 'Consultando...' : 'Consultar'}
          </button>
        </div>

        <p className="search-hint">{currentType.hint} · Fonte: API Escavador v2</p>
      </div>

      {/* Layout principal: resultado + detalhe */}
      <div className={`results-layout ${selected ? 'with-detail' : ''}`}>

        {/* Coluna esquerda: resultados + histórico */}
        <div className="results-col">

          {/* Estado de loading */}
          {loading && (
            <div className="state-box">
              <Loader2 size={32} className="spin gold" />
              <p>Consultando API do Escavador...</p>
            </div>
          )}

          {/* Erro */}
          {!loading && error && (
            <div className="error-box card">
              <AlertCircle size={20} />
              <div>
                <strong>Nenhum resultado</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Resultados */}
          {!loading && results && results.length > 0 && (
            <div className="results-list">
              <div className="results-header">
                <span className="results-count">{results.length} processo{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}</span>
                <SearchTypeBadge type={searchType} />
              </div>
              {results.map((p, i) => (
                <ProcessCard
                  key={p.id || p.numero_cnj || i}
                  process={p}
                  isSelected={selected?.numero_cnj === p.numero_cnj && selected?.id === p.id}
                  onClick={() => setSelected(selected?.id === p.id && selected?.numero_cnj === p.numero_cnj ? null : p)}
                />
              ))}
            </div>
          )}

          {/* Histórico de buscas (quando não há resultados ativos) */}
          {!loading && results === null && history.length > 0 && (
            <div className="history-section card">
              <div className="history-header">
                <History size={15} />
                <span>Consultas recentes</span>
              </div>
              <div className="history-list">
                {history.map((h, i) => (
                  <button key={i} className="history-item" onClick={() => handleHistoryClick(h)}>
                    <div className="history-left">
                      <SearchTypeBadge type={h.type} />
                      <span className="history-query">{h.query}</span>
                    </div>
                    <div className="history-right">
                      <span className="history-count">{h.resultCount} resultado{h.resultCount !== 1 ? 's' : ''}</span>
                      <span className="history-time">{h.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Estado inicial sem histórico */}
          {!loading && results === null && history.length === 0 && (
            <div className="empty-state">
              <Scale size={48} className="empty-icon" />
              <h3>Pesquise processos jurídicos</h3>
              <p>Consulte pelo número CNJ, nome da parte ou CPF/CNPJ diretamente na base do Escavador.</p>
              <div className="empty-tips">
                <div className="tip"><strong>CNJ</strong> Para busca precisa por processo específico</div>
                <div className="tip"><strong>Nome</strong> Para encontrar todos os processos de uma parte</div>
                <div className="tip"><strong>CPF/CNPJ</strong> Para consultar pelo documento da parte</div>
              </div>
            </div>
          )}
        </div>

        {/* Coluna direita: detalhe do processo */}
        {selected && (
          <div className="detail-col">
            <ProcessDetail process={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>

      <style jsx>{`
        .consulta-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .subtitle {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .btn-clear {
          display: flex; align-items: center; gap: 0.5rem;
          background: var(--surface); border: 1px solid var(--border);
          padding: 0.5rem 1rem; border-radius: 8px;
          font-size: 0.85rem; color: var(--text-muted);
          transition: 0.2s;
        }
        .btn-clear:hover { border-color: var(--text-muted); color: var(--text); }

        /* Search Card */
        .search-card { padding: 0; overflow: hidden; }

        .search-type-tabs {
          display: flex;
          border-bottom: 1px solid var(--border);
          background: rgba(255,255,255,0.02);
        }
        .type-tab {
          padding: 0.85rem 1.5rem;
          font-size: 0.85rem; font-weight: 600;
          color: var(--text-muted);
          border-bottom: 2px solid transparent;
          transition: 0.2s;
          margin-bottom: -1px;
        }
        .type-tab:hover { color: var(--text); }
        .type-tab.active { color: var(--primary); border-bottom-color: var(--primary); }

        .search-input-area {
          display: flex; gap: 1rem; align-items: center;
          padding: 1.25rem 1.5rem;
        }
        .search-input-wrap {
          flex: 1; position: relative; display: flex; align-items: center;
        }
        .search-icon {
          position: absolute; left: 14px; color: var(--text-muted); pointer-events: none;
        }
        .search-input {
          width: 100%;
          background: var(--surface-light);
          border: 1px solid var(--border);
          padding: 0.85rem 2.75rem 0.85rem 2.75rem;
          border-radius: 8px;
          color: var(--text);
          font-size: 1rem;
          font-family: monospace;
          outline: none;
          transition: 0.2s;
        }
        .search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(194,161,95,0.08); }
        .input-clear {
          position: absolute; right: 12px; color: var(--text-muted); padding: 2px; border-radius: 4px;
          transition: 0.2s;
        }
        .input-clear:hover { color: var(--text); }
        .search-btn {
          display: flex; align-items: center; gap: 0.5rem;
          background: var(--primary); color: #000;
          padding: 0.85rem 1.75rem;
          border-radius: 8px;
          font-weight: 700; font-size: 0.9rem;
          white-space: nowrap;
          transition: 0.2s;
          flex-shrink: 0;
        }
        .search-btn:hover:not(:disabled) { background: #d4b47a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(194,161,95,0.25); }
        .search-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .search-hint { padding: 0 1.5rem 1rem; font-size: 0.72rem; color: var(--text-muted); }

        /* Layout */
        .results-layout { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
        .results-layout.with-detail { grid-template-columns: 1fr 1fr; }
        .results-col { display: flex; flex-direction: column; gap: 1rem; }
        .detail-col { position: sticky; top: 1rem; max-height: calc(100vh - 120px); overflow-y: auto; }

        /* States */
        .state-box {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 1rem; padding: 4rem; color: var(--text-muted); text-align: center;
        }
        .state-box p { font-size: 0.9rem; }
        .error-box {
          display: flex; align-items: flex-start; gap: 1rem;
          padding: 1.25rem 1.5rem;
          background: rgba(239,68,68,0.06); border-color: rgba(239,68,68,0.2);
          color: #fc8181;
        }
        .error-box strong { display: block; font-size: 0.9rem; margin-bottom: 0.25rem; }
        .error-box p { font-size: 0.8rem; color: #fc8181aa; margin: 0; }

        /* Results */
        .results-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 0.25rem;
        }
        .results-count { font-size: 0.78rem; color: var(--text-muted); }
        .results-list { display: flex; flex-direction: column; gap: 0.75rem; }

        /* History */
        .history-section { padding: 0; overflow: hidden; }
        .history-header {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.85rem 1.25rem;
          font-size: 0.75rem; font-weight: 600; color: var(--text-muted);
          border-bottom: 1px solid var(--border);
          letter-spacing: 0.5px;
        }
        .history-list { display: flex; flex-direction: column; }
        .history-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.75rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: 0.15s; text-align: left;
          width: 100%;
        }
        .history-item:last-child { border-bottom: none; }
        .history-item:hover { background: rgba(255,255,255,0.03); }
        .history-left { display: flex; align-items: center; gap: 0.6rem; }
        .history-query { font-size: 0.85rem; font-family: monospace; color: var(--text); }
        .history-right { display: flex; align-items: center; gap: 0.75rem; }
        .history-count { font-size: 0.72rem; color: var(--text-muted); }
        .history-time { font-size: 0.7rem; color: var(--text-muted); }

        /* Empty state */
        .empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 4rem 2rem; text-align: center; color: var(--text-muted);
          gap: 1rem;
        }
        .empty-icon { color: rgba(194,161,95,0.2); }
        .empty-state h3 { font-size: 1.1rem; color: var(--text); margin: 0; }
        .empty-state p { font-size: 0.875rem; max-width: 400px; line-height: 1.6; margin: 0; }
        .empty-tips {
          display: flex; flex-direction: column; gap: 0.5rem;
          margin-top: 0.5rem; width: 100%; max-width: 360px; text-align: left;
        }
        .tip {
          background: var(--surface); border: 1px solid var(--border);
          padding: 0.6rem 1rem; border-radius: 6px; font-size: 0.78rem; color: var(--text-muted);
        }
        .tip strong { color: var(--primary); margin-right: 0.4rem; }

        /* Spinner */
        :global(.spin) { animation: spin 1s linear infinite; }
        :global(.gold) { color: var(--primary); }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .results-layout.with-detail { grid-template-columns: 1fr; }
          .detail-col { position: static; max-height: none; }
        }
      `}</style>
    </div>
  );
}
