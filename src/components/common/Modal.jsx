import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

/**
 * Modal — accessible overlay dialog
 * Props: open, onClose, title, size (sm/md/lg/xl/full), children
 */
export default function Modal({ open, onClose, title, size = 'md', children, footer, noPadding }) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={`modal modal-${size} animate-fade-in`} role="dialog" aria-modal="true">
        {/* Header */}
        {(title || onClose) && (
          <div className="modal-header">
            {title && <h2 className="modal-title">{title}</h2>}
            {onClose && (
              <button className="btn btn-ghost btn-icon modal-close" onClick={onClose}>
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={`modal-body ${noPadding ? 'no-padding' : ''}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
