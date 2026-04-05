import React from 'react';

const Badge = ({ variant = 'primary', children, className = '' }) => {
  const getStyle = () => {
    const styles = {
      primary:  { backgroundColor: '#EEF2FF', color: '#4F46E5', borderColor: '#C7D2FE' },
      success:  { backgroundColor: '#DCFCE7', color: '#15803D', borderColor: '#BBF7D0' },
      error:    { backgroundColor: '#FEE2E2', color: '#DC2626', borderColor: '#FECACA' },
      warning:  { backgroundColor: '#FEF3C7', color: '#D97706', borderColor: '#FCD34D' },
      info:     { backgroundColor: '#DBEAFE', color: '#2563EB', borderColor: '#93C5FD' },
      exact:    { backgroundColor: '#DCFCE7', color: '#15803D', borderColor: '#BBF7D0' },
      fuzzy:    { backgroundColor: '#FEF3C7', color: '#D97706', borderColor: '#FCD34D' },
      new:      { backgroundColor: '#FEE2E2', color: '#DC2626', borderColor: '#FECACA' },
      approved: { backgroundColor: '#DCFCE7', color: '#15803D', borderColor: '#BBF7D0' },
      pending:  { backgroundColor: '#FEF3C7', color: '#D97706', borderColor: '#FCD34D' },
      rejected: { backgroundColor: '#FEE2E2', color: '#DC2626', borderColor: '#FECACA' },
    };
    return styles[variant] || styles.primary;
  };

  const style = getStyle();

  return (
    <span 
      style={{ 
        backgroundColor: style.backgroundColor, 
        color: style.color,
        borderColor: style.borderColor,
        border: `1px solid ${style.borderColor}`,
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold cursor-default hover:scale-105 ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
