import React from 'react';

const StatusBadge = ({ status = 'uploaded', className = '' }) => {
  const config = {
    uploaded: {
      bg: '#F1F5F9',
      text: '#475569',
      dot: '#94A3B8',
      label: 'Uploaded',
      active: false,
    },
    parsing: {
      bg: '#DBEAFE',
      text: '#1E40AF',
      dot: '#3B82F6',
      label: 'Parsing',
      active: true,
    },
    parsed: {
      bg: '#EEF2FF',
      text: '#4338CA',
      dot: '#6366F1',
      label: 'Parsed',
      active: false,
    },
    validating: {
      bg: '#F3E8FF',
      text: '#7C3AED',
      dot: '#8B5CF6',
      label: 'Validating',
      active: true,
    },
    validated: {
      bg: '#FAE8FF',
      text: '#A21CAF',
      dot: '#C026D3',
      label: 'Validated',
      active: false,
    },
    translating: {
      bg: '#FEF3C7',
      text: '#B45309',
      dot: '#F59E0B',
      label: 'Translating',
      active: true,
    },
    translated: {
      bg: '#FEF9C3',
      text: '#A16207',
      dot: '#EAB308',
      label: 'Translated',
      active: false,
    },
    reviewing: {
      bg: '#FFEDD5',
      text: '#C2410C',
      dot: '#F97316',
      label: 'Reviewing',
      active: true,
    },
    completed: {
      bg: '#DCFCE7',
      text: '#166534',
      dot: '#22C55E',
      label: 'Completed',
      active: false,
    },
  };

  const { bg, text, dot, label, active } = config[status.toLowerCase()] || config.uploaded;

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}
      style={{
        backgroundColor: bg,
        color: text,
        border: `1px solid ${bg}`,
      }}
    >
      <span
        className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${active ? 'status-dot-pulse' : ''}`}
        style={{ backgroundColor: dot }}
      />
      {label}
    </div>
  );
};

export default StatusBadge;
