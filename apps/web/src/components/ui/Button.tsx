import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClass: Record<string, string> = {
  primary:     'sk-btn-primary',
  secondary:   'sk-btn-secondary',
  outline:     'sk-btn-outline',
  ghost:       'sk-btn-ghost',
  destructive: 'sk-btn-destructive',
  danger:      'sk-btn-destructive',
};

const sizeClass: Record<string, string> = {
  sm: 'sk-btn-sm',
  md: 'sk-btn-md',
  lg: 'sk-btn-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  isLoading,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const busy = loading || isLoading;
  return (
    <button
      className={`sk-btn ${variantClass[variant] ?? variantClass.primary} ${sizeClass[size]} ${className}`}
      disabled={disabled || busy}
      {...props}
    >
      {busy ? (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon ? (
        <span className="shrink-0 [&>*]:w-4 [&>*]:h-4">{leftIcon}</span>
      ) : null}
      {children}
      {!busy && rightIcon && (
        <span className="shrink-0 [&>*]:w-4 [&>*]:h-4">{rightIcon}</span>
      )}
    </button>
  );
}
