import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  className = '',
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
      } ${className}`}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-[4px] border transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-1 focus-visible:ring-offset-bg-0 ${
          checked
            ? 'bg-cyan-dim border-cyan/40'
            : 'bg-bg-2 border-line-2 hover:border-line-1'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-2.5 w-2.5 rounded-[2px] transition-transform duration-fast ${
            checked
              ? 'translate-x-3.5 bg-cyan'
              : 'translate-x-0.5 bg-text-3'
          }`}
        />
      </button>
      {label && <span className="text-body text-text-1">{label}</span>}
    </label>
  );
};
