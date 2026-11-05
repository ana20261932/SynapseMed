import React from 'react';

interface BaseInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  as?: 'input' | 'textarea';
}

interface TextAreaInputProps extends BaseInputProps, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'label' | 'error' | 'helperText' | 'className' | 'as'> {
  as: 'textarea';
}

interface InputElementProps extends BaseInputProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'label' | 'error' | 'helperText' | 'className' | 'as'> {
  as?: 'input';
}

export type InputProps = TextAreaInputProps | InputElementProps;

export function Input({ label, error, helperText, className = '', as = 'input', ...props }: InputProps) {
  const Comp = as === 'textarea' ? 'textarea' : 'input';
  return (
    <div className={className}>
      {label && <label className="block text-sm font-semibold text-clinic-700 mb-1.5">{label}</label>}
      <Comp
        className={`w-full border rounded-xl px-4 py-2.5 text-sm text-clinic-900 focus:outline-none focus:ring-2 focus:ring-synapse-500 focus:border-transparent transition-colors disabled:bg-clinic-50 disabled:text-clinic-400 ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-clinic-300'
        }`}
        {...(props as Record<string, unknown>)}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-clinic-400">{helperText}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function TextArea({ label, error, helperText, className = '', ...props }: TextAreaProps) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-semibold text-clinic-700 mb-1.5">{label}</label>}
      <textarea
        className={`w-full border rounded-xl px-4 py-2.5 text-sm text-clinic-900 focus:outline-none focus:ring-2 focus:ring-synapse-500 focus:border-transparent transition-colors disabled:bg-clinic-50 disabled:text-clinic-400 ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-clinic-300'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-clinic-400">{helperText}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Select({ label, error, helperText, className = '', ...props }: SelectProps) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-semibold text-clinic-700 mb-1.5">{label}</label>}
      <select
        className={`w-full border rounded-xl px-4 py-2.5 text-sm text-clinic-900 focus:outline-none focus:ring-2 focus:ring-synapse-500 focus:border-transparent transition-colors disabled:bg-clinic-50 disabled:text-clinic-400 ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-clinic-300'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-clinic-400">{helperText}</p>}
    </div>
  );
}
