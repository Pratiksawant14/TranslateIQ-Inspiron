import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false, 
  loading = false, 
  children,
  className = '',
  type = 'button'
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500/40";
  
  const getVariantStyle = () => {
    const styles = {
      primary: {
        backgroundColor: 'var(--color-primary)',
        color: '#FFFFFF',
        borderColor: 'transparent',
      },
      secondary: {
        backgroundColor: 'var(--color-bg-surface)',
        color: 'var(--color-text-primary)',
        borderColor: 'var(--color-border)',
        border: '1px solid var(--color-border)',
      },
      danger: {
        backgroundColor: 'var(--color-error)',
        color: '#FFFFFF',
        borderColor: 'transparent',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'var(--color-primary)',
        borderColor: 'transparent',
        border: '1px solid transparent',
      },
      success: {
        backgroundColor: 'var(--color-success)',
        color: '#FFFFFF',
        borderColor: 'transparent',
      },
    };
    return styles[variant] || styles.primary;
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-6 py-3"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={getVariantStyle()}
      className={`
        ${baseStyles}
        ${sizes[size]}
        ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90 hover:shadow-md'}
        ${className}
      `}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
