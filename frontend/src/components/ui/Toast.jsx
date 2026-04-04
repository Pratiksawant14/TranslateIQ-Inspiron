import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const Toast = () => {
  const { toasts } = useToast();

  const variantStyles = {
    success: 'border-green-500/50 bg-green-950/80 text-green-300',
    error: 'border-red-500/50 bg-red-950/80 text-red-300',
    info: 'border-blue-500/50 bg-blue-950/80 text-blue-300',
  };

  const iconColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg min-w-[300px]
            animate-[slideIn_0.3s_ease-out]
            ${variantStyles[t.variant] || variantStyles.info}
          `}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${iconColors[t.variant] || iconColors.info}`}></span>
          <span className="text-sm font-medium flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
};

export default Toast;
