import React, { createContext, useContext, useState } from 'react';

// ── Context ────────────────────────────────────────────────────────────────

const TabsContext = createContext<{
  activeValue: string;
  onValueChange: (v: string) => void;
} | null>(null);

// ── Tabs root ──────────────────────────────────────────────────────────────

interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  className?: string;
}

export function Tabs({ children, defaultValue, value, onValueChange, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? '');
  const activeValue = value !== undefined ? value : internal;
  const handleChange = (v: string) => {
    if (value === undefined) setInternal(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ activeValue, onValueChange: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// ── TabList ────────────────────────────────────────────────────────────────

interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function TabList({ children, className = '', ...props }: TabListProps) {
  return (
    <div className={`sk-tabs-list ${className}`} role="tablist" {...props}>
      {children}
    </div>
  );
}

// ── TabTrigger ─────────────────────────────────────────────────────────────

interface TabTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

export function TabTrigger({ value, children, className = '', disabled, ...props }: TabTriggerProps) {
  const ctx = useContext(TabsContext);
  const active = ctx?.activeValue === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => { if (!disabled && ctx) ctx.onValueChange(value); }}
      disabled={disabled}
      className={`sk-tab ${active ? 'sk-tab-active' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ── TabContent ─────────────────────────────────────────────────────────────

interface TabContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabContent({ value, children, className }: TabContentProps) {
  const ctx = useContext(TabsContext);
  if (ctx?.activeValue !== value) return null;
  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}

// ── Utility hook ───────────────────────────────────────────────────────────

export function useTabs(defaultValue = '') {
  const [activeValue, setActiveValue] = useState(defaultValue);
  return { activeValue, setActiveValue };
}
