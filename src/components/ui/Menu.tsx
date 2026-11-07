import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Portal } from './Portal';

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  divider?: boolean;
}

export interface MenuProps {
  trigger: React.ReactElement;
  items: MenuItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const Menu: React.FC<MenuProps> = ({
  trigger,
  items,
  align = 'left',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 4;
    const menuWidth = 190;

    let left = rect.left;
    if (align === 'right') {
      left = rect.right - menuWidth;
    }

    left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));
    const top = rect.bottom + gap;

    setCoords({ top, left });
  }, [align]);

  const toggle = () => {
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

  const clonedTrigger = React.cloneElement(trigger, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const { ref } = trigger as unknown as { ref?: React.Ref<HTMLElement> };
      if (typeof ref === 'function') ref(node);
      else if (ref && 'current' in ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    onClick: (e: React.MouseEvent) => {
      trigger.props.onClick?.(e);
      toggle();
    },
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
  });

  return (
    <>
      {clonedTrigger}
      {isOpen && (
        <Portal>
          <div
            ref={menuRef}
            role="menu"
            className={`fixed z-[70] min-w-[190px] bg-bg-2 border border-line-2 rounded-card shadow-float py-1.5 select-none animate-in fade-in duration-fast ${className}`}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
          >
            {items.map((item, index) => {
              if (item.divider) {
                return <div key={`div-${index}`} className="h-[1px] bg-line-1 my-1 mx-2" />;
              }

              return (
                <button
                  key={item.id}
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    item.onClick?.();
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`w-[calc(100%-12px)] h-8 px-2.5 mx-1.5 flex items-center justify-between text-body text-left rounded-control transition-colors duration-fast disabled:opacity-40 disabled:cursor-not-allowed ${
                    item.danger
                      ? 'text-red hover:bg-red/10'
                      : 'text-text-1 hover:bg-bg-3'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.icon && (
                      <span className="w-3.5 h-3.5 flex items-center justify-center text-text-3 [&>svg]:w-3.5 [&>svg]:h-3.5">
                        {item.icon}
                      </span>
                    )}
                    <span>{item.label}</span>
                  </div>
                  {item.shortcut && (
                    <span className="font-mono text-data text-text-3 uppercase">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Portal>
      )}
    </>
  );
};
