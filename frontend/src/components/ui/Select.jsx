import React from 'react';

const Select = ({ label, options = [], value, onChange, error, className = '', ...props }) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300">{label}</label>
      )}
      <select
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 rounded-lg bg-[#0A1628] border text-white text-sm
          focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-colors
          appearance-none cursor-pointer
          ${error ? 'border-red-500' : 'border-[#1E3A5F]'}
        `}
        {...props}
      >
        <option value="" className="text-slate-500">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0A1628] text-white">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default Select;
