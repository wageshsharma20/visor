import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { Portal } from './Portal';
import { toast, ToastItem, ToastType } from './toastStore';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>(toast.getActive());

  useEffect(() => {
    return toast.subscribe((updated) => setToasts(updated));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <Portal>
      <div
        role="region"
        aria-label="Notifications"
        className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none max-w-sm w-full"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => toast.dismiss(item.id)} />
        ))}
      </div>
    </Portal>
  );
};

interface ToastCardProps {
  item: ToastItem;
  onDismiss: () => void;
}

export const ToastCard: React.FC<ToastCardProps> = ({ item, onDismiss }) => {
  const iconMap: Record<ToastType, React.ReactNode> = {
    info: <Info className="w-4 h-4 text-accent-bright shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-accent-bright shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red shrink-0" />,
  };

  const borderMap: Record<ToastType, string> = {
    info: 'border-line-2',
    success: 'border-accent/30',
    warning: 'border-amber/30',
    error: 'border-red/30',
  };

  return (
    <div
      role="status"
      className={`pointer-events-auto bg-bg-2 border ${borderMap[item.type]} rounded-card shadow-float p-3 flex items-start gap-3 transition-all duration-base animate-in fade-in slide-in-from-top-2`}
    >
      <div className="mt-0.5">{iconMap[item.type]}</div>
      <div className="flex-1 min-w-0">
        <div className="text-body font-body-strong text-text-1 truncate">{item.title}</div>
        {item.message && (
          <div className="text-small text-text-2 mt-0.5 break-words">{item.message}</div>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-text-3 hover:text-text-1 p-1 rounded-chip transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
