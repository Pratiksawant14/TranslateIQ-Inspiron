import React from 'react';

const StatusBadge = ({ status = 'uploaded', className = '' }) => {
  const config = {
    uploaded: { color: 'bg-slate-400', label: 'Uploaded' },
    parsing: { color: 'bg-blue-400', label: 'Parsing' },
    parsed: { color: 'bg-indigo-400', label: 'Parsed' },
    validating: { color: 'bg-purple-400', label: 'Validating' },
    validated: { color: 'bg-pink-400', label: 'Validated' },
    translating: { color: 'bg-amber-400', label: 'Translating' },
    translated: { color: 'bg-yellow-400', label: 'Translated' },
    reviewing: { color: 'bg-orange-400', label: 'Reviewing' },
    completed: { color: 'bg-green-500', label: 'Completed' },
  };

  const { color, label } = config[status.toLowerCase()] || config.uploaded;

  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm font-medium text-slate-300 ${className}`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${color}`}></span>
      {label}
    </div>
  );
};

export default StatusBadge;
