import React from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { useApp, ACTIONS } from '../../context/AppContext';
import './Toast.css';

const ICONS = {
  success: <CheckCircle size={16} />,
  error:   <XCircle    size={16} />,
  warning: <AlertCircle size={16} />,
  info:    <Info        size={16} />,
};

export default function ToastContainer() {
  const { state, dispatch } = useApp();

  return (
    <div className="toast-container">
      {state.toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => dispatch({ type: ACTIONS.REMOVE_TOAST, id: toast.id })}
        />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  return (
    <div className={`toast toast-${toast.type || 'info'} animate-fade-in`}>
      <span className="toast-icon">{ICONS[toast.type] || ICONS.info}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close btn btn-ghost btn-icon" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
}
