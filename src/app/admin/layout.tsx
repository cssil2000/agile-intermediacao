'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  Bell, 
  LogOut,
  Maximize2,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';

const SidebarItem = ({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) => (
  <Link href={href}>
    <div className={`sidebar-item ${active ? 'active' : ''}`}>
      <Icon size={20} />
      <span>{label}</span>
    </div>
  </Link>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial check
    checkUser();

    // 2. Listen for changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  // Skip layout for login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 className="animate-spin" size={48} color="#c2a15f" />
        <p>Verificando acesso...</p>
        <style jsx>{`
          .loading-screen {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #001F26;
            color: #8d9596;
            gap: 1rem;
          }
          .animate-spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="admin-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">AG</div>
          <span>AGILE ADMIN</span>
        </div>
        
        <nav className="sidebar-nav">
          <SidebarItem 
            href="/admin/dashboard" 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={pathname === '/admin/dashboard'} 
          />
          <SidebarItem 
            href="/admin/oportunidades" 
            icon={Briefcase} 
            label="Oportunidades" 
            active={pathname.startsWith('/admin/oportunidades')} 
          />
          <SidebarItem 
            href="/admin/revisao" 
            icon={Clock} 
            label="Revisão Humana" 
            active={pathname === '/admin/revisao'} 
          />
          <SidebarItem 
            href="/admin/propostas" 
            icon={CheckCircle} 
            label="Propostas" 
            active={pathname === '/admin/propostas'} 
          />
        </nav>

        <div className="sidebar-footer">
          <SidebarItem 
            href="/admin/configuracoes" 
            icon={Settings} 
            label="Configurações" 
            active={pathname === '/admin/configuracoes'} 
          />
          <div className="sidebar-item logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Sair</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-search">
            <input type="text" placeholder="Pesquisar processo, CPF, nome..." />
          </div>
          <div className="topbar-actions">
            <button className="icon-btn"><Bell size={20} /></button>
            <button className="icon-btn"><Maximize2 size={20} /></button>
            <div className="user-profile">
              <div className="user-avatar">AD</div>
            </div>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>

      <style jsx>{`
        .sidebar {
          width: 260px;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
        }

        .sidebar-logo {
          padding: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: 1px;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: var(--primary);
          color: var(--background);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 14px;
        }

        .sidebar-nav {
          flex: 1;
          padding: 0 1rem;
        }

        :global(.sidebar-item) {
          padding: 0.75rem 1rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 1rem;
          color: var(--text-muted);
          transition: all 0.2s;
          margin-bottom: 0.5rem;
          cursor: pointer;
        }

        :global(.sidebar-item:hover) {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text);
        }

        :global(.sidebar-item.active) {
          background: rgba(194, 161, 95, 0.1);
          color: var(--primary);
          border: 1px solid rgba(194, 161, 95, 0.2);
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid var(--border);
        }

        .logout {
          color: #ef4444;
        }

        .topbar {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 2rem;
        }

        .topbar-search input {
          background: var(--surface-light);
          border: 1px solid var(--border);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          color: var(--text);
          width: 300px;
          outline: none;
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .icon-btn {
          color: var(--text-muted);
          padding: 0.5rem;
          border-radius: 8px;
        }

        .icon-btn:hover {
          background: var(--surface-light);
          color: var(--text);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          background: var(--primary);
          color: var(--background);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
        }

        .page-content {
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
