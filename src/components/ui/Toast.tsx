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
    info: <Info className="w-4 h-4 text-cyan shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-green shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red shrink-0" />,
  };

  const borderMap: Record<ToastType, string> = {
    info: 'border-cyan/30',
    success: 'border-green/30',
    warning: 'border-amber/30',
    error: 'border-red/30',
  };

  return (
    <div
      role="status"
      className={`pointer-events-auto bg-bg-1 border ${borderMap[item.type]} rounded-[4px] shadow-floating p-3 flex items-start gap-2.5 transition-all duration-base animate-in fade-in slide-in-from-top-2`}
    >
      <div className="mt-0.5">{iconMap[item.type]}</div>
      <div className="flex-1 min-w-0">
        <div className="text-body font-medium text-text-1 truncate">{item.title}</div>
        {item.message && (
          <div className="text-small text-text-2 mt-0.5 break-words">{item.message}</div>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-text-3 hover:text-text-1 p-0.5 rounded-[2px] transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
