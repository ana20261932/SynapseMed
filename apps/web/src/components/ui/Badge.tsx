import React from 'react';

// ── Badge ──────────────────────────────────────────────────────────────────

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'draft' | 'verified' | 'default';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const badgeClass: Record<BadgeVariant, string> = {
  success:  'sk-badge sk-badge-success',
  warning:  'sk-badge sk-badge-warning',
  danger:   'sk-badge sk-badge-danger',
  info:     'sk-badge sk-badge-info',
  draft:    'sk-badge sk-badge-draft',
  verified: 'sk-badge sk-badge-verified',
  default:  'sk-badge sk-badge-default',
};

export function Badge({ variant = 'default', children, className = '', ...props }: BadgeProps) {
  return (
    <span className={`${badgeClass[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}

// ── StatCard ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: string;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral' | 'flat';
  sparkline?: number[];
  icon?: React.ReactNode;
}

const ARROW_UP = (
  <svg className="inline w-3 h-3" viewBox="0 0 12 12" fill="none">
    <path d="M6 9V3M3 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ARROW_DOWN = (
  <svg className="inline w-3 h-3" viewBox="0 0 12 12" fill="none">
    <path d="M6 3v6M3 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function StatCard({ title, value, description, change, delta, trend = 'neutral', icon }: StatCardProps) {
  const deltaLabel = delta || change;
  const effectiveTrend = trend === 'flat' ? 'neutral' : trend;
  const deltaClass = effectiveTrend === 'up' ? 'sk-stat-delta-up' : effectiveTrend === 'down' ? 'sk-stat-delta-down' : 'sk-stat-delta-flat';

  return (
    <div className="sk-stat-card">
      <div className="flex items-start justify-between gap-2">
        <p className="sk-stat-label">{title}</p>
        {icon && (
          <span className="p-1.5 rounded-lg shrink-0" style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent-fg)' }}>
            {icon}
          </span>
        )}
      </div>
      <p className="sk-stat-value">{value}</p>
      {(deltaLabel || description) && (
        <p className={`flex items-center gap-1 ${deltaClass}`}>
          {deltaLabel && effectiveTrend === 'up' && ARROW_UP}
          {deltaLabel && effectiveTrend === 'down' && ARROW_DOWN}
          {deltaLabel && <span>{deltaLabel}</span>}
          {description && <span className="sk-stat-label font-normal normal-case tracking-normal ml-1">{description}</span>}
        </p>
      )}
    </div>
  );
}
