'use client';

import React from 'react';
import { Settings, Shield, Bell, User, Database } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="settings-container">
      <div className="section-header">
        <h1 className="title">Configurações</h1>
      </div>

      <div className="settings-grid">
        <div className="card settings-menu">
          <div className="menu-item active"><User size={18} /> Perfil</div>
          <div className="menu-item"><Shield size={18} /> Segurança</div>
          <div className="menu-item"><Bell size={18} /> Notificações</div>
          <div className="menu-item"><Database size={18} /> Sincronização</div>
        </div>

        <div className="card settings-content">
          <h3>Configurações do Perfil</h3>
          <p style={{ color: '#8d9596', marginBottom: '2rem' }}>Gerencie suas informações de acesso administrativo.</p>
          
          <div className="form-group">
            <label>Nome do Administrador</label>
            <input type="text" defaultValue="Admin Agile" disabled />
          </div>

          <div className="form-group mt-1">
            <label>E-mail</label>
            <input type="email" defaultValue="contato@agile.com" disabled />
          </div>

          <div className="form-group mt-1">
            <label>Nível de Acesso</label>
            <div className="access-badge">ADMINISTRADOR MASTER</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-container { display: flex; flex-direction: column; gap: 1.5rem; }
        .settings-grid { display: grid; grid-template-columns: 240px 1fr; gap: 1.5rem; }
        .card { background: #121d26; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); padding: 1.5rem; }
        .menu-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; border-radius: 8px; color: #8d9596; cursor: pointer; transition: 0.2s; margin-bottom: 0.5rem; }
        .menu-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .menu-item.active { background: rgba(194, 161, 95, 0.1); color: #c2a15f; border: 1px solid rgba(194, 161, 95, 0.2); }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.8rem; color: #8d9596; font-weight: 600; }
        .form-group input { background: #1a2a35; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.75rem; color: #fff; opacity: 0.7; }
        .access-badge { display: inline-block; background: #c2a15f; color: #000; padding: 4px 12px; border-radius: 4px; font-weight: 800; font-size: 0.7rem; }
        .mt-1 { margin-top: 1.5rem; }
      `}</style>
    </div>
  );
}
