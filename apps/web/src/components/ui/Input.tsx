import React from 'react';

// ── Label ──────────────────────────────────────────────────────────────────

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

export function Label({ children, required, className = '', ...props }: LabelProps) {
  return (
    <label className={`sk-label ${className}`} {...props}>
      {children}
      {required && <span style={{ color: 'var(--color-danger-fg)', marginLeft: 2 }} aria-hidden>*</span>}
    </label>
  );
}

// ── Helper / error text ────────────────────────────────────────────────────

function HelperText({ text, isError }: { text: string; isError?: boolean }) {
  return (
    <p className="mt-1 text-xs" style={{ color: isError ? 'var(--color-danger-fg)' : 'var(--color-fg-subtle)' }}>
      {text}
    </p>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────

interface BaseInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  as?: 'input' | 'textarea';
}

interface TextAreaInputProps
  extends BaseInputProps,
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'label' | 'error' | 'helperText' | 'className' | 'as'> {
  as: 'textarea';
}

interface InputElementProps
  extends BaseInputProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'label' | 'error' | 'helperText' | 'className' | 'as'> {
  as?: 'input';
}

export type InputProps = TextAreaInputProps | InputElementProps;

export function Input({ label, error, helperText, className = '', as = 'input', ...props }: InputProps) {
  const Comp = as === 'textarea' ? 'textarea' : 'input';
  const inputStyle = error ? { borderColor: 'var(--color-danger-solid)' } : undefined;
  return (
    <div className={`sk-field-group ${className}`}>
      {label && <Label>{label}</Label>}
      <Comp
        className="sk-input"
        style={inputStyle}
        {...(props as Record<string, unknown>)}
      />
      {error && <HelperText text={error} isError />}
      {helperText && !error && <HelperText text={helperText} />}
    </div>
  );
}

// ── Textarea ───────────────────────────────────────────────────────────────

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function TextArea({ label, error, helperText, className = '', ...props }: TextAreaProps) {
  const inputStyle = error ? { borderColor: 'var(--color-danger-solid)', height: 'auto', minHeight: 80 } : { height: 'auto', minHeight: 80 };
  return (
    <div className={`sk-field-group ${className}`}>
      {label && <Label>{label}</Label>}
      <textarea className="sk-input" style={inputStyle} {...props} />
      {error && <HelperText text={error} isError />}
      {helperText && !error && <HelperText text={helperText} />}
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Select({ label, error, helperText, className = '', children, ...props }: SelectProps) {
  const inputStyle = error ? { borderColor: 'var(--color-danger-solid)' } : undefined;
  return (
    <div className={`sk-field-group ${className}`}>
      {label && <Label>{label}</Label>}
      <select className="sk-input" style={inputStyle} {...props}>
        {children}
      </select>
      {error && <HelperText text={error} isError />}
      {helperText && !error && <HelperText text={helperText} />}
    </div>
  );
}
