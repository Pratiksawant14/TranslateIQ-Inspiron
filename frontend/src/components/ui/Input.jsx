import React from 'react';

const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300">{label}</label>
      )}
      <input
        className={`w-full px-3 py-2 rounded-lg bg-[#0A1628] border text-white text-sm placeholder:text-slate-500
          focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-colors
          ${error ? 'border-red-500' : 'border-[#1E3A5F]'}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default Input;
