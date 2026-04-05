import React from 'react';

const Select = ({ label, options = [], value, onChange, error, className = '', ...props }) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">{label}</label>
      )}
      <select
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 rounded-lg bg-[var(--color-bg-surface)] border text-[var(--color-text-primary)] text-sm
          focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-colors
          appearance-none cursor-pointer
          ${error ? 'border-red-500' : 'border-[var(--color-border)]'}
        `}
        {...props}
      >
        <option value="" className="text-[var(--color-text-secondary)]">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default Select;
