'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronRight } from 'lucide-react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Início', href: '/' },
    { name: 'Crédito Trabalhista', href: '/trabalhista' },
    { name: 'Precatórios', href: '/precatorios' },
    { name: 'Como Funciona', href: '#como-funciona' },
    { name: 'Benefícios', href: '#beneficios' },
  ];

  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="header-inner">
          <Link href="/" className="logo-container">
            <div className="logo-svg">
              <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 28L18 4H22L12 28H8Z" fill="white" />
                <path d="M18 28L28 4H32L22 28H18Z" fill="white" />
                <path d="M28 28L31 20H35L32 28H28Z" fill="white" />
              </svg>
            </div>
            <div className="logo-text">
              <span className="logo-brand">AGILE</span>
              <span className="logo-subtitle">INTERMEDIAÇÃO</span>
            </div>
          </Link>

          <nav className="desktop-nav">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className={pathname === link.href ? 'active' : ''}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <Link href="/admin/dashboard" className="btn-client">
              {isAdminPage ? 'Dashboard' : 'Área do Cliente'}
            </Link>
            <button 
              className="mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <nav>
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name} <ChevronRight size={16} />
            </Link>
          ))}
          <Link 
            href="/admin/dashboard" 
            className="mobile-admin-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Área do Cliente
          </Link>
        </nav>
      </div>

      <style jsx>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 1000;
          padding: 1.5rem 0;
          transition: all 0.3s ease;
          background: transparent;
        }

        .header.scrolled {
          background: #000000;
          backdrop-filter: blur(10px);
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .header-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .logo-svg {
          display: flex;
          align-items: center;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
          line-height: 0.9;
          margin-top: 2px;
        }

        .logo-brand {
          font-family: var(--font-sans);
          font-size: 1.8rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: 2px;
        }

        .logo-subtitle {
          font-family: var(--font-sans);
          font-size: 0.65rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: 3.5px;
          margin-top: 2px;
        }

        .desktop-nav {
          display: flex;
          gap: 2.5rem;
        }

        .desktop-nav a {
          color: #a0a0a0;
          font-weight: 600;
          font-size: 0.85rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: color 0.3s ease;
        }

        .desktop-nav a:hover, .desktop-nav a.active {
          color: #fff;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .btn-client {
          padding: 0.6rem 1.2rem;
          border: 1px solid var(--color-gold);
          border-radius: 8px;
          color: var(--color-gold);
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .btn-client:hover {
          background: rgba(194, 161, 95, 0.1);
          transform: translateY(-2px);
        }

        .mobile-toggle {
          display: none;
          color: #fff;
        }

        .mobile-menu {
          position: fixed;
          top: 0;
          right: -100%;
          width: 80%;
          height: 100vh;
          background: #000000;
          z-index: 999;
          transition: right 0.3s ease;
          padding: 6rem 2rem 2rem;
          border-left: 1px solid rgba(255, 255, 255, 0.05);
        }

        .mobile-menu.open {
          right: 0;
        }

        .mobile-menu nav {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .mobile-menu nav a {
          font-size: 1.2rem;
          font-weight: 600;
          color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .mobile-admin-link {
          margin-top: 1rem;
          color: var(--color-gold) !important;
        }

        @media (max-width: 768px) {
          .desktop-nav {
            display: none;
          }

          .mobile-toggle {
            display: block;
          }

          .btn-client {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
