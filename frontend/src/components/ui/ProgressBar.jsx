import React from 'react';

const ProgressBar = ({ value = 0, color = 'blue', showLabel = false, className = '' }) => {
  const safeValue = Math.min(Math.max(value, 0), 100);
  
  const colors = {
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
  };
  
  const barColor = colors[color] || colors.blue;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-slate-300">{Math.round(safeValue)}%</span>
        </div>
      )}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
