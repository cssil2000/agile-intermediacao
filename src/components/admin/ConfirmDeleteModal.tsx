'use client';

import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
  loading?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  loading = false
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-icon">
          <AlertTriangle size={32} />
        </div>

        <h2>{title}</h2>
        <p className="modal-desc">{description}</p>

        {itemName && (
          <div className="item-preview">
            <span>{itemName}</span>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            {loading ? 'Apagando...' : 'Confirmar Exclusão'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        .modal-content {
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 2rem;
          max-width: 440px;
          width: 90%;
          position: relative;
          animation: slideUp 0.3s ease;
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          color: #8d9596;
          padding: 0.5rem;
          border-radius: 8px;
          transition: 0.2s;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .modal-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #fff;
        }

        .modal-desc {
          color: #8d9596;
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 1.25rem;
        }

        .item-preview {
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.15);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
        }

        .item-preview span {
          color: #ef4444;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn-cancel {
          padding: 0.7rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.875rem;
          background: rgba(255, 255, 255, 0.05);
          color: #8d9596;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: 0.2s;
        }

        .btn-cancel:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .btn-danger {
          padding: 0.7rem 1.5rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.875rem;
          background: #ef4444;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: 0.2s;
        }

        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
          transform: translateY(-1px);
        }

        .btn-danger:disabled,
        .btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        :global(.animate-spin) {
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
