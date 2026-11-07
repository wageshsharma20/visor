import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';
import { Portal } from './Portal';

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string | number> {
  label?: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function Select<T extends string | number>({
  label,
  options,
  value,
  onChange,
  error,
  disabled = false,
  placeholder = 'Select option...',
  className = '',
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((o) => o.value === value);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 4;
    setCoords({
      top: rect.bottom + gap,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const handleScrollOrResize = () => updatePosition();
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  return (
    <div className={`flex flex-col w-full relative ${className}`}>
      {label && (
        <span className="text-label text-text-2 mb-1.5 select-none">
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={toggleOpen}
        className={`w-full h-9 bg-bg-3 border border-transparent hover:border-line-2 focus:border-accent text-text-1 text-body rounded-control px-3 flex items-center justify-between transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-40 disabled:cursor-not-allowed ${
          error ? '!border-red' : ''
        }`}
      >
        <span className={selectedOption ? 'text-text-1 truncate' : 'text-text-3 truncate'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-3 shrink-0 transition-transform duration-fast ${
            isOpen ? 'rotate-180 text-text-1' : ''
          }`}
        />
      </button>

      {error && (
        <div className="flex items-center gap-1.5 text-small text-red mt-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isOpen && (
        <Portal>
          <div
            ref={menuRef}
            role="listbox"
            tabIndex={-1}
            className="fixed z-[70] bg-bg-2 border border-line-2 rounded-card shadow-float max-h-60 overflow-y-auto py-1"
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
            }}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={String(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`h-8 px-3 flex items-center justify-between text-body cursor-pointer transition-colors duration-fast ${
                    isSelected
                      ? 'bg-accent-dim text-accent-bright font-body-strong'
                      : 'text-text-1 hover:bg-bg-3'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-accent-bright shrink-0" />}
                </div>
              );
            })}
          </div>
        </Portal>
      )}
    </div>
  );
}
