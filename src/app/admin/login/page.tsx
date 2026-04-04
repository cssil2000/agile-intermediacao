'use client';

import React, { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { ADMIN_EMAILS } from '@/config/auth';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

  // Check for URL errors (e.g., redirection from layout)
  React.useEffect(() => {
    if (urlError === 'unauthorized') {
      setError('Acesso não autorizado. Use um e-mail de administrador.');
    }
  }, [urlError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (authError) throw authError;

      // Direct authorization check after login
      if (user && !ADMIN_EMAILS.includes(user.email || '')) {
        await supabase.auth.signOut();
        setError('Este e-mail não possui permissão de administrador.');
        setLoading(false);
        return;
      }

      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Credenciais inválidas ou erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <Image 
              src="/logo-agile.jpg" 
              alt="Agile Intermediação" 
              width={180} 
              height={60} 
              className="login-logo"
            />
          </div>
          <p>Painel Administrativo Agile</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>E-mail Corporativo</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                placeholder="seu@agile.com.br" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Senha</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>Entrar no Painel <ArrowRight size={20} /></>
            )}
          </button>
        </form>

        <div className="login-footer">
          <span>Esqueceu a senha? Entre em contato com o suporte técnico.</span>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: #0d0d0d;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: #161616;
          padding: 3rem;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .logo-container {
          margin: 0 auto 1.5rem;
          display: flex;
          justify-content: center;
        }

        .login-logo {
          object-fit: contain;
          filter: brightness(1.2);
        }

        h1 {
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }

        p {
          color: var(--text-muted, #8d9596);
          font-size: 0.9rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #fff;
          margin-left: 0.5rem;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #8d9596;
        }

        input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0.8rem 1rem 0.8rem 3rem;
          color: #fff;
          font-size: 1rem;
          transition: 0.2s;
        }

        input:focus {
          border-color: #c2a15f;
          outline: none;
          background: rgba(255, 255, 255, 0.05);
        }

        .error-message {
          color: #ef4444;
          font-size: 0.85rem;
          text-align: center;
          background: rgba(239, 68, 68, 0.1);
          padding: 0.75rem;
          border-radius: 8px;
        }

        .login-btn {
          margin-top: 1rem;
          background: #c2a15f;
          color: #000;
          border: none;
          padding: 1rem;
          border-radius: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          cursor: pointer;
          transition: 0.3s;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(194, 161, 95, 0.2);
        }

        .login-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.75rem;
          color: #8d9596;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#0d0d0d', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={48} color="#c2a15f" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
