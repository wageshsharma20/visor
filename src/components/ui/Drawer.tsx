import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Portal } from './Portal';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: 'left' | 'right';
  width?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  side = 'right',
  width = 'w-[360px]',
  children,
  footer,
}) => {
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;

      const timer = window.setTimeout(() => {
        if (!drawerRef.current) return;
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          drawerRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
          return;
        }

        if (e.key === 'Tab' && drawerRef.current) {
          const focusable = Array.from(
            drawerRef.current.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => !el.hasAttribute('disabled'));

          if (focusable.length === 0) return;

          const firstEl = focusable[0];
          const lastEl = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstEl) {
              e.preventDefault();
              lastEl.focus();
            }
          } else {
            if (document.activeElement === lastEl) {
              e.preventDefault();
              firstEl.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
        if (previouslyFocusedElement.current) {
          previouslyFocusedElement.current.focus();
        }
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  const sideClasses =
    side === 'left'
      ? 'left-0 rounded-r-panel rounded-l-none border-r border-line-2 animate-in slide-in-from-left duration-slow'
      : 'right-0 rounded-l-panel rounded-r-none border-l border-line-2 animate-in slide-in-from-right duration-slow';

  return (
    <Portal>
      <div className="fixed inset-0 z-[40]">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/70 transition-opacity duration-slow"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Drawer content */}
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className={`fixed inset-y-0 ${sideClasses} ${width} max-w-[90vw] bg-bg-2 shadow-float flex flex-col z-10 outline-none`}
        >
          {/* Header */}
          <div className="h-11 min-h-[44px] px-4 flex items-center justify-between border-b border-line-1 select-none">
            <span className="font-sans text-body-strong text-text-1">
              {title}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="w-8 h-8 flex items-center justify-center rounded-control text-text-3 hover:text-text-1 hover:bg-bg-3 transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 text-body text-text-2">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="h-11 min-h-[44px] px-4 bg-bg-3 border-t border-line-1 flex items-center justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
};
