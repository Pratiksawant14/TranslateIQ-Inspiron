import React from 'react';

const ProgressBar = ({ value = 0, color = 'blue', showLabel = false, className = '' }) => {
  const safeValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {Math.round(safeValue)}%
          </span>
        </div>
      )}
      <div
        className="w-full rounded-full h-2 overflow-hidden"
        style={{ backgroundColor: 'var(--color-border-light)' }}
      >
        <div 
          className="h-full rounded-full transition-all duration-700 ease-out progress-shimmer"
          style={{
            width: `${safeValue}%`,
            background: 'linear-gradient(90deg, #06B6D4, #4F46E5)',
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
