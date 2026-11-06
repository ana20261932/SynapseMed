import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClass: Record<string, string> = {
  none: 'p-0',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
};

export function Card({ children, hover = false, padding = 'md', className = '', style, ...props }: CardProps) {
  const padClass = padding === 'md' ? '' : paddingClass[padding]; // md is handled by .sk-card default
  return (
    <div
      className={`sk-card ${hover ? 'sk-card-hover' : ''} ${padClass} ${className}`}
      style={padding === 'md' ? style : { padding: undefined, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`mb-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function CardTitle({ children, className = '', ...props }: CardTitleProps) {
  return (
    <h3
      className={`text-base font-semibold ${className}`}
      style={{ color: 'var(--color-fg-default)' }}
      {...props}
    >
      {children}
    </h3>
  );
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardBody({ children, className = '', ...props }: CardBodyProps) {
  return <div className={className} {...props}>{children}</div>;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ children, className = '', ...props }: CardFooterProps) {
  return (
    <div
      className={`mt-5 flex items-center justify-between pt-4 ${className}`}
      style={{ borderTop: '1px solid var(--color-border-default)' }}
      {...props}
    >
      {children}
    </div>
  );
}
