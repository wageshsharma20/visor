import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Portal } from './Portal';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-md',
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;

      // Focus the dialog container or first focusable element
      const timer = window.setTimeout(() => {
        if (!dialogRef.current) return;
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          dialogRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
          return;
        }

        // Focus trap
        if (e.key === 'Tab' && dialogRef.current) {
          const focusable = Array.from(
            dialogRef.current.querySelectorAll<HTMLElement>(
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

  return (
    <Portal>
      <div className="fixed inset-0 z-[50] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/75 transition-opacity duration-base"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Dialog Content */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby={description ? 'dialog-description' : undefined}
          tabIndex={-1}
          className={`relative w-full ${maxWidth} bg-bg-1 border border-line-1 rounded-[6px] shadow-floating flex flex-col overflow-hidden outline-none z-10 transition-transform duration-base`}
        >
          {/* Header */}
          <div className="h-[44px] px-4 flex items-center justify-between border-b border-line-1 bg-bg-1 select-none">
            <h2 id="dialog-title" className="font-sans text-body-strong text-text-1">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="w-7 h-7 flex items-center justify-center rounded-[4px] text-text-3 hover:text-text-1 hover:bg-bg-3 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description & Body */}
          <div className="p-4 text-body text-text-2 flex flex-col gap-3">
            {description && (
              <p id="dialog-description" className="text-small text-text-3">
                {description}
              </p>
            )}
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="h-[44px] px-4 bg-bg-2 border-t border-line-1 flex items-center justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
};
