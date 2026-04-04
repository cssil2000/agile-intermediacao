'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Home, 
  Gavel, 
  Shield, 
  LayoutDashboard, 
  ExternalLink, 
  FileText, 
  Users, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function PortalPage() {
  const nextRoutes = [
    { name: 'Home (Next.js)', path: '/', icon: <Home size={20} />, status: 'Nova' },
    { name: 'Trabalhista', path: '/trabalhista', icon: <Gavel size={20} />, status: 'Nova' },
    { name: 'Precatórios', path: '/precatorios', icon: <Shield size={20} />, status: 'Nova' },
    { name: 'Admin Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, status: 'Admin' },
  ];

  const legacyPages = [
    { name: 'Home (Estática)', path: '/index.html', icon: <FileText size={20} /> },
    { name: 'Para Advogados', path: '/advogados.html', icon: <Gavel size={20} /> },
    { name: 'Para Reclamantes', path: '/reclamantes.html', icon: <Users size={20} /> },
    { name: 'Dashboard Legado', path: '/dashboard.html', icon: <LayoutDashboard size={20} /> },
    { name: 'Formulário Lead', path: '/form.html', icon: <CheckCircle size={20} /> },
    { name: 'Página Sucesso', path: '/sucesso.html', icon: <CheckCircle size={20} /> },
  ];

  return (
    <div className="portal-container">
      <header className="portal-header">
        <div className="container">
          <span className="badge-premium">DEVELOPER HUB</span>
          <h1 className="portal-title">Agile <span className="gold">Intermediação</span></h1>
          <p className="portal-subtitle">Portal de Desenvolvimento Local & Migração</p>
        </div>
      </header>

      <main className="container">
        <div className="portal-grid">
          {/* NEXT.JS TRUNK */}
          <section className="portal-section">
            <h2 className="section-label">Novas Rotas (Next.js)</h2>
            <div className="routes-list">
              {nextRoutes.map((route) => (
                <Link key={route.path} href={route.path} className="route-card featured">
                  <div className="route-icon">{route.icon}</div>
                  <div className="route-info">
                    <h3>{route.name}</h3>
                    <code className="route-path">{route.path}</code>
                  </div>
                  <div className={`route-status ${route.status.toLowerCase()}`}>{route.status}</div>
                  <ArrowRight className="arrow" size={16} />
                </Link>
              ))}
            </div>
          </section>

          {/* LEGACY TRUNK */}
          <section className="portal-section">
            <h2 className="section-label">Páginas Legadas (HTML Estático)</h2>
            <div className="routes-list">
              {legacyPages.map((route) => (
                <a key={route.path} href={route.path} className="route-card legacy">
                  <div className="route-icon">{route.icon}</div>
                  <div className="route-info">
                    <h3>{route.name}</h3>
                    <code className="route-path">{route.path}</code>
                  </div>
                  <ExternalLink className="arrow" size={16} />
                </a>
              ))}
            </div>
          </section>
        </div>
        
        <div className="footer-note">
           <p>Este portal é apenas para fins de desenvolvimento local.</p>
        </div>
      </main>

      <style jsx>{`
        .portal-container {
          min-height: 100vh;
          background: #0d0d0d;
          color: white;
          padding-bottom: 4rem;
          font-family: 'Inter', sans-serif;
        }
        .container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        .portal-header {
          padding: 6rem 0 4rem;
          text-align: center;
          background: radial-gradient(circle at top, rgba(194, 161, 95, 0.1), transparent 60%);
        }
        .badge-premium {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 2px;
          color: #c2a15f;
          border: 1px solid rgba(194,161,95,0.3);
          padding: 0.45rem 1.25rem;
          border-radius: 99px;
          background: rgba(194,161,95,0.05);
          display: inline-block;
        }
        .portal-title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          margin-top: 1.5rem;
          font-weight: 800;
          letter-spacing: -1px;
        }
        .gold { color: #c2a15f; }
        .portal-subtitle {
          color: #94a3b8;
          font-size: 1.1rem;
          margin-top: 0.75rem;
        }
        .portal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          margin-top: 3rem;
        }
        .section-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #c2a15f;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(194, 161, 95, 0.2);
        }
        .routes-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .route-card {
          background: #161616;
          border: 1px solid #232323;
          padding: 1.5rem;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          text-decoration: none;
          color: white;
        }
        .route-card:hover {
          transform: translateY(-5px) scale(1.02);
          border-color: #c2a15f;
          background: #1a2a36;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .route-card.featured {
          background: linear-gradient(135deg, #1a1a1a 0%, #111111 100%);
        }
        .route-icon {
          width: 52px;
          height: 52px;
          background: rgba(194, 161, 95, 0.1);
          color: #c2a15f;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .route-info h3 {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 0.3rem;
        }
        .route-path {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.7rem;
          color: #64748b;
          letter-spacing: 0.5px;
        }
        .route-status {
          margin-left: auto;
          margin-right: 3rem;
          font-size: 0.6rem;
          font-weight: 800;
          padding: 0.3rem 0.75rem;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .route-status.nova { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
        .route-status.admin { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
        .arrow {
          position: absolute;
          right: 1.5rem;
          color: #233544;
          transition: all 0.3s ease;
        }
        .route-card:hover .arrow {
          color: #c2a15f;
          transform: translateX(3px);
        }
        .footer-note {
          margin-top: 6rem;
          text-align: center;
          padding: 2rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          color: #64748b;
          font-size: 0.8rem;
        }
        @media (max-width: 900px) {
          .portal-grid { grid-template-columns: 1fr; gap: 3rem; }
          .route-status { display: none; }
        }
      `}</style>
    </div>
  );
}
