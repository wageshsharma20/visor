export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;
let activeToasts: ToastItem[] = [];
const listeners: Set<ToastListener> = new Set();

export const toast = {
  show: (type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastItem = { id, type, title, message, duration };
    activeToasts = [...activeToasts, newToast];
    listeners.forEach((l) => l(activeToasts));

    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }
    return id;
  },
  info: (title: string, message?: string) => toast.show('info', title, message),
  success: (title: string, message?: string) => toast.show('success', title, message),
  warning: (title: string, message?: string) => toast.show('warning', title, message),
  error: (title: string, message?: string) => toast.show('error', title, message),
  dismiss: (id: string) => {
    activeToasts = activeToasts.filter((t) => t.id !== id);
    listeners.forEach((l) => l(activeToasts));
  },
  clearAll: () => {
    activeToasts = [];
    listeners.forEach((l) => l(activeToasts));
  },
  subscribe: (listener: ToastListener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getActive: () => activeToasts,
};
