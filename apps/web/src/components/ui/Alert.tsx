import React from 'react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', title, children, className = '', ...props }: AlertProps) {
  const variants: Record<string, string> = {
    info: 'bg-synapse-50 border border-synapse-200 text-synapse-800',
    success: 'bg-green-50 border border-green-200 text-green-800',
    warning: 'bg-amber-50 border border-amber-200 text-amber-800',
    error: 'bg-red-50 border border-red-200 text-red-800',
  };
  const icons: Record<string, string> = {
    info: '<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
    success: '<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>',
    warning: '<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>',
    error: '<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>',
  };
  return (
    <div
      className={`relative rounded-xl border px-4 py-3 text-sm ${variants[variant]} ${className}`
      } {...props}>
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-5 h-5">{icons[variant]}</span>
        <div className="flex-1">
          {title && <h4 className="font-semibold text-sm">{title}</h4>}
          <div className="mt-0.5 text-sm opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
}
