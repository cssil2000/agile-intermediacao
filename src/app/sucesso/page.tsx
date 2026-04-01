'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle2, Clock, Mail, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchCase = async () => {
        const { data, error } = await supabase
          .from('cases')
          .select('internal_reference, leads(email, full_name)')
          .eq('id', id)
          .single();
        
        if (data) setCaseData(data);
        setLoading(false);
      };
      fetchCase();
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="status-container">
        <Loader2 className="animate-spin gold" size={48} />
        <p>Carregando confirmação...</p>
      </div>
    );
  }

  return (
    <div className="success-container reveal">
      <div className="icon-wrapper">
        <CheckCircle2 size={72} className="gold" />
      </div>
      
      <h1>Solicitação Recebida!</h1>
      <p className="subtitle">
        Olá, <strong>{caseData?.leads?.full_name || 'Titular'}</strong>. Sua solicitação de análise foi enviada com sucesso para nossa equipe técnica.
      </p>

      <div className="reference-card">
        <span className="label">Protocolo de Acompanhamento</span>
        <div className="ref-val">{caseData?.internal_reference || 'AGI-PENDENTE'}</div>
        <p>Guarde este número para futuras consultas.</p>
      </div>

      <div className="next-steps">
        <div className="next-step-item">
          <Clock size={24} className="gold" />
          <div>
            <h4>Análise em 48 Horas</h4>
            <p>Nossa equipe jurídica iniciará a triagem digital imediatamente. Você receberá um diagnóstico preliminar em até 2 dias úteis.</p>
          </div>
        </div>
        <div className="next-step-item">
          <Mail size={24} className="gold" />
          <div>
            <h4>Verifique seu Email</h4>
            <p>Enviamos uma confirmação para <strong>{caseData?.leads?.email || 'seu email'}</strong> com os detalhes da solicitação.</p>
          </div>
        </div>
      </div>

      <div className="actions">
        <Link href="/" className="btn btn-primary">Voltar para Início</Link>
        <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
          Falar com Suporte <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="success-page">
      <Header />
      <main className="container-small">
        <Suspense fallback={
          <div className="status-container">
            <Loader2 className="animate-spin gold" size={48} />
          </div>
        }>
          <SuccessContent />
        </Suspense>
      </main>
      <Footer />

      <style jsx>{`
        .success-page {
          background: #001F26;
          min-height: 100vh;
        }

        .container-small {
          max-width: 600px;
          margin: 0 auto;
          padding: 10rem 1.5rem 6rem;
        }

        .status-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          min-height: 40vh;
        }

        .success-container {
          background: #121d26;
          padding: 4rem 3rem;
          border-radius: 32px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .icon-wrapper {
          margin-bottom: 2rem;
        }

        h1 {
          font-family: var(--font-heading);
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .subtitle {
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 2.5rem;
        }

        .reference-card {
          background: rgba(194, 161, 95, 0.05);
          border: 1px dashed var(--color-gold);
          padding: 2rem;
          border-radius: 16px;
          margin-bottom: 3rem;
        }

        .reference-card .label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--color-gold);
          display: block;
          margin-bottom: 0.5rem;
        }

        .ref-val {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .reference-card p {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .next-steps {
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .next-step-item {
          display: flex;
          gap: 1.5rem;
        }

        .next-step-item h4 {
          font-size: 1.1rem;
          margin-bottom: 0.3rem;
        }

        .next-step-item p {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn {
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          transition: all 0.3s ease;
        }

        .btn-primary { background: var(--color-gold); color: #000; }
        .btn-outline { border: 1px solid var(--color-gold); color: var(--color-gold); }

        .gold { color: var(--color-gold); }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .reveal {
          animation: revealUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes revealUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 600px) {
          .actions { flex-direction: column; }
          .success-container { padding: 3rem 1.5rem; }
          h1 { font-size: 2rem; }
        }
      `}</style>
    </div>
  );
}
