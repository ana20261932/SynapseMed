import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext<{ activeValue: string; onValueChange: (v: string) => void } | null>(null);

interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  className?: string;
}

interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

interface TabTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

interface TabContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ children, defaultValue, className }: TabsProps) {
  const [activeValue, setActiveValue] = useState(defaultValue ?? '');
  return (
    <TabsContext.Provider value={{ activeValue, onValueChange: setActiveValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ children, className }: TabListProps) {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-lg border border-clinic-200 bg-clinic-50 p-1 ${className}`}
    >
      {children}
    </div>
  );
}

export function TabTrigger({ value, children, className = '', disabled }: TabTriggerProps) {
  const ctx = useContext(TabsContext);
  const active = ctx ? ctx.activeValue === value : false;
  const handleClick = () => { if (!disabled && ctx) ctx.onValueChange(value); };
  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${
        active
          ? 'bg-white shadow-sm text-synapse-700'
          : 'text-clinic-600 hover:text-clinic-900 hover:bg-clinic-100'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabContent({ value, children, className }: TabContentProps) {
  const ctx = useContext(TabsContext);
  const active = ctx ? ctx.activeValue === value : false;
  if (!active) return null;
  return <div className={className}>{children}</div>;
}

export function useTabs(defaultValue = '') {
  const [activeValue, setActiveValue] = useState(defaultValue);
  return { activeValue, setActiveValue };
}
