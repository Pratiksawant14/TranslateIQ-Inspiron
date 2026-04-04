import React from 'react';

const Card = ({ children, className = '', onClick = undefined }) => {
  const isClickable = !!onClick;
  
  return (
    <div 
      onClick={onClick}
      className={`bg-[#162032] rounded-xl border border-[#1E3A5F]/50 shadow-sm overflow-hidden
        ${isClickable ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#2D4A77]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
