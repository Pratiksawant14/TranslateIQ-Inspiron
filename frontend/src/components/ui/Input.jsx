import React from 'react';

const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">{label}</label>
      )}
      <input
        className={`w-full px-3 py-2 rounded-lg bg-[var(--color-bg-surface)] border text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-secondary)]
          focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-colors
          ${error ? 'border-red-500' : 'border-[var(--color-border)]'}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default Input;
