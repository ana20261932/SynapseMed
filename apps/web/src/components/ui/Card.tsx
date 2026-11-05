import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, hover = false, padding = 'md', className = '', ...props }: CardProps) {
  const paddings: Record<string, string> = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  return (
    <div
      className={`bg-white border border-clinic-200 rounded-2xl shadow-card transition-shadow duration-200 ${
        hover ? 'hover:shadow-card-hover' : ''
      } ${paddings[padding]} ${className}`}
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
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function CardTitle({ children, className = '', ...props }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-clinic-900 ${className}`} {...props}>
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
    <div className={`mt-6 flex items-center justify-between border-t border-clinic-100 pt-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
