'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Instagram, Linkedin, Facebook } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo">
              <span className="gold">AGILE</span> INTERMEDIAÇÃO
            </Link>
            <p className="brand-description">
              Sua parceira estratégica em inteligência jurídico-financeira. 
              Análise ágil, transparente e focada na antecipação de ativos judiciais de maior valor.
            </p>
            <div className="social-links">
              <Link href="#"><Instagram size={20} /></Link>
              <Link href="#"><Linkedin size={20} /></Link>
              <Link href="#"><Facebook size={20} /></Link>
            </div>
          </div>

          <div className="footer-links">
            <h4>Soluções</h4>
            <ul>
              <li><Link href="/trabalhista">Crédito Trabalhista</Link></li>
              <li><Link href="/precatorios">Precatórios</Link></li>
              <li><Link href="/advogados">Para Advogados</Link></li>
              <li><Link href="/reclamantes">Para Reclamantes</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Empresa</h4>
            <ul>
                <li><Link href="/sobre">Sobre Nós</Link></li>
                <li><Link href="/privacidade">Privacidade</Link></li>
                <li><Link href="/termos">Termos de Uso</Link></li>
                <li><Link href="/contato">Contato</Link></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Fale Conosco</h4>
            <div className="contact-item">
              <Mail size={18} className="gold" />
              <span>contato@agile.com</span>
            </div>
            <div className="contact-item">
              <Phone size={18} className="gold" />
              <span>(11) 9999-9999</span>
            </div>
            <div className="contact-item">
              <MapPin size={18} className="gold" />
              <span>São Paulo, SP - Brasil</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Agile Intermediação. Todos os direitos reservados.</p>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: #001F26;
          padding: 6rem 0 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 3rem;
          margin-bottom: 4rem;
        }

        .footer-brand {
          grid-column: span 1.5;
        }

        .logo {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 1px;
          display: block;
          margin-bottom: 1.5rem;
        }

        .logo .gold {
          color: var(--color-gold);
        }

        .brand-description {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.6;
          max-width: 320px;
          margin-bottom: 2rem;
        }

        .social-links {
          display: flex;
          gap: 1.2rem;
        }

        .social-links a {
          color: var(--text-muted);
          transition: color 0.3s ease;
        }

        .social-links a:hover {
          color: var(--color-gold);
        }

        h4 {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
          color: #fff;
        }

        ul {
          list-style: none;
          padding: 0;
        }

        li {
          margin-bottom: 0.8rem;
        }

        li a {
          color: var(--text-muted);
          font-size: 0.9rem;
          transition: color 0.3s ease;
        }

        li a:hover {
          color: var(--color-gold);
          padding-left: 5px;
        }

        .footer-contact {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .gold {
          color: var(--color-gold);
        }

        .footer-bottom {
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        @media (max-width: 768px) {
          .footer-brand {
            grid-column: span 1;
            text-align: center;
          }

          .brand-description {
            margin: 0 auto 2rem;
          }

          .social-links {
            justify-content: center;
          }

          .footer-grid {
            text-align: center;
          }

          .contact-item {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
}
