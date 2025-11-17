import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

type ToastType = 'success' | 'error' | 'info' | 'warning';

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
};

const toastColors: Record<ToastType, string> = {
  success: 'rgb(var(--success))',
  error: 'rgb(var(--error))',
  info: 'rgb(var(--info))',
  warning: 'rgb(var(--warning))',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-5 right-5 z-[1001] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="w-80 rounded-lg shadow-medium p-4 flex items-center gap-3 pointer-events-auto transition-normal"
          style={{
            backgroundColor: `rgb(var(--surface))`,
            border: `1px solid var(--border)`,
            animation: 'slideInRight 300ms ease-out',
          }}
        >
          <style>{`
            @keyframes slideInRight {
              from {
                opacity: 0;
                transform: translateX(100px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>

          <div style={{ color: toastColors[toast.type] }}>{toastIcons[toast.type]}</div>
          <p className="flex-1 m-0 text-sm" style={{ color: `rgb(var(--text-primary))` }}>
            {toast.message}
          </p>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded transition-fast"
            style={{ color: `rgb(var(--text-muted))` }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `rgb(var(--surface-hover))`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
