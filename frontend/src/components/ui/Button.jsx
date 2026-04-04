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
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A1628]";
  
  const variants = {
    primary: "bg-[#2563EB] hover:bg-[#1D4ED8] text-white focus:ring-[#2563EB]",
    secondary: "bg-transparent border border-[#1E3A5F] hover:bg-[#1E3A5F]/50 text-slate-200 focus:ring-[#1E3A5F]",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-600",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-300 focus:ring-slate-800",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-600"
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
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
