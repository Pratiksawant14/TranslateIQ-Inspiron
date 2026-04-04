import React from 'react';

const Badge = ({ variant = 'new', children, className = '' }) => {
  const variantStyles = {
    exact: 'bg-green-600 text-white',
    fuzzy: 'bg-amber-400 text-slate-900',
    new: 'bg-red-500 text-white',
    approved: 'bg-green-600 text-white',
    pending: 'bg-amber-400 text-slate-900',
    rejected: 'bg-red-500 text-white',
    low: 'bg-slate-600 text-white',
    medium: 'bg-amber-500 text-white',
    high: 'bg-red-600 text-white',
  };

  const style = variantStyles[variant] || variantStyles.new;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${style} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
