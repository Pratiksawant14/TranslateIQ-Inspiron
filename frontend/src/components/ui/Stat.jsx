import React from 'react';
import Card from './Card';
import useCountUp from '../../hooks/useCountUp';

const Stat = ({ label, value, subtitle, icon: Icon, color = 'primary' }) => {
  const animatedValue = useCountUp(value, 1200);

  const colorMap = {
    primary: {
      icon: { backgroundColor: '#EEF2FF', color: '#4F46E5' },
      accent: '#4F46E5',
    },
    success: {
      icon: { backgroundColor: '#DCFCE7', color: '#10B981' },
      accent: '#10B981',
    },
    error: {
      icon: { backgroundColor: '#FEE2E2', color: '#EF4444' },
      accent: '#EF4444',
    },
    warning: {
      icon: { backgroundColor: '#FEF3C7', color: '#D97706' },
      accent: '#D97706',
    },
    info: {
      icon: { backgroundColor: '#DBEAFE', color: '#3B82F6' },
      accent: '#3B82F6',
    },
  };

  const currentColor = colorMap[color] || colorMap.primary;

  return (
    <div className="stat-card-animated">
      <Card
        variant="elevated"
        className="stat-glass"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border)',
          borderLeft: `3px solid ${currentColor.accent}`,
        }}
      >
        <div className="flex items-center justify-between p-5">
          <div className="space-y-1">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {label}
            </p>
            <p
              className="text-3xl font-bold font-display tabular-nums"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {animatedValue}
            </p>
            {subtitle && (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {Icon && (
            <div
              className="p-3 rounded-xl"
              style={currentColor.icon}
            >
              <Icon className="w-6 h-6" />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Stat;
