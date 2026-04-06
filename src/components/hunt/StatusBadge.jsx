import React, { useState, useRef, useEffect } from 'react';
import { Circle, Loader, CheckCircle, XCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import './StatusBadge.css';

export const STATUS_CONFIG = {
  null: {
    label: 'Not Started',
    icon: Circle,
    cls: 'status-not-started',
  },
  'in-progress': {
    label: 'In Progress',
    icon: Loader,
    cls: 'status-in-progress',
  },
  'complete': {
    label: 'Complete',
    icon: CheckCircle,
    cls: 'status-complete',
  },
  'no-findings': {
    label: 'No Findings',
    icon: XCircle,
    cls: 'status-no-findings',
  },
  'escalated': {
    label: 'Escalated',
    icon: AlertTriangle,
    cls: 'status-escalated',
  },
};

export const STATUS_OPTIONS = [null, 'in-progress', 'complete', 'no-findings', 'escalated'];

export default function StatusBadge({ status, onChange, size = 'sm', readonly = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG[null];
  const Icon = cfg.icon;

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (readonly) {
    return (
      <span className={`status-badge ${cfg.cls} size-${size}`}>
        <Icon size={size === 'sm' ? 10 : 12} />
        {cfg.label}
      </span>
    );
  }

  return (
    <div className="status-badge-wrapper" ref={ref}>
      <button
        className={`status-badge ${cfg.cls} size-${size} clickable`}
        onClick={() => setOpen(!open)}
        title="Change status"
      >
        <Icon size={size === 'sm' ? 10 : 12} />
        {cfg.label}
        <ChevronDown size={9} style={{ marginLeft: 1, opacity: 0.6 }} />
      </button>

      {open && (
        <div className="status-dropdown">
          {STATUS_OPTIONS.map(s => {
            const c = STATUS_CONFIG[s] || STATUS_CONFIG[null];
            const I = c.icon;
            return (
              <button
                key={String(s)}
                className={`status-dropdown-item ${c.cls} ${s === status ? 'active' : ''}`}
                onClick={() => { onChange?.(s); setOpen(false); }}
              >
                <I size={12} />
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
