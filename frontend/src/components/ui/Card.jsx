import React from 'react';

const Card = ({ children, className = '', onClick = undefined, variant = 'default', style: externalStyle = {} }) => {
  const isClickable = !!onClick;
  
  const getStyle = () => {
    const base = {
      backgroundColor: 'rgba(255, 255, 255, 0.82)',
      backdropFilter: 'blur(8px) saturate(150%)',
      WebkitBackdropFilter: 'blur(8px) saturate(150%)',
      borderColor: 'rgba(226, 232, 240, 0.7)',
      borderWidth: '1px',
      borderRadius: 'var(--radius-lg)',
    };

    if (variant === 'elevated') {
      return { ...base, backgroundColor: 'rgba(255, 255, 255, 0.88)', boxShadow: 'var(--shadow-md)' };
    }
    if (variant === 'outlined') {
      return { ...base, backgroundColor: 'transparent', backdropFilter: 'none', WebkitBackdropFilter: 'none' };
    }
    return { ...base, boxShadow: 'var(--shadow-sm)' };
  };
  
  return (
    <div 
      onClick={onClick}
      style={{ ...getStyle(), ...externalStyle }}
      className={`
        overflow-hidden
        ${isClickable ? 'cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-indigo-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
