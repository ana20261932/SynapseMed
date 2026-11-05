import React from 'react';
import { Card } from './Card';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'draft' | 'verified' | 'default';
  children: React.ReactNode;
}

export function Badge({ variant = 'default', children, className = '', ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    success: 'bg-synapse-50 text-synapse-700 border border-synapse-100',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
    danger: 'bg-red-50 text-red-700 border border-red-100',
    info: 'bg-clinic-100 text-clinic-700 border border-clinic-200',
    draft: 'bg-clinic-100 text-clinic-600 border border-clinic-200',
    verified: 'bg-green-50 text-green-700 border border-green-100',
    default: 'bg-clinic-100 text-clinic-600 border border-clinic-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export function StatCard({ title, value, change, trend = 'neutral', icon }: StatCardProps) {
  const trendColors: Record<string, string> = {
    up: 'text-synapse-600',
    down: 'text-red-600',
    neutral: 'text-clinic-500',
  };
  return (
    <Card padding="sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-clinic-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-clinic-900 mt-1">{value}</p>
        </div>
        {icon && <div className="p-2 bg-synapse-50 rounded-lg text-synapse-600">{icon}</div>}
      </div>
      {change && (
        <p className={`mt-2 text-xs font-medium flex items-center gap-1 ${trendColors[trend]}`}>
          {trend === 'up' ? <span className="w-1.5 h-1.5 bg-synapse-600 rounded-full" /> : trend === 'down' ? <span className="w-1.5 h-1.5 bg-red-600 rounded-full" /> : null}
          {change}
        </p>
      )}
    </Card>
  );
}
