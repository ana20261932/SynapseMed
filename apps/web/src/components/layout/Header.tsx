import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  user: { firstName?: string; lastName?: string; email?: string } | null;
  practice: { name?: string; organisationType?: string } | null;
  onMenuClick: () => void;
}

export function Header({ user, practice, onMenuClick }: HeaderProps) {
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'U';

  return (
    <header className="sk-topbar fixed top-0 left-0 right-0 z-50 h-14">
      <div className="flex items-center h-full px-4 gap-3">

        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="sk-btn sk-btn-ghost sk-btn-sm md:hidden"
          aria-label="Toggle navigation"
          style={{ padding: '6px' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Brand (shown on mobile, hidden on desktop where sidebar shows it) */}
        <div className="flex items-center gap-2 md:hidden">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'var(--color-accent-default)' }}
          >
            S
          </div>
          <span className="font-bold text-base tracking-tight" style={{ color: 'var(--color-fg-default)' }}>
            SynapseMed
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Practice pill */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            background: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border-default)',
            color: 'var(--color-fg-muted)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--color-fg-subtle)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>{practice?.name || 'No practice selected'}</span>
        </div>

        {/* Online indicator */}
        <div
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            background: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border-default)',
            color: 'var(--color-fg-muted)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'var(--color-accent-default)' }}
          />
          Online
        </div>

        {/* User avatar */}
        <div
          className="hidden md:flex items-center gap-2 pl-3"
          style={{ borderLeft: '1px solid var(--color-border-default)' }}
        >
          <div className="text-right hidden lg:block">
            <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--color-fg-default)' }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] leading-tight" style={{ color: 'var(--color-fg-subtle)' }}>
              {user?.email}
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent-fg)' }}
          >
            {initials}
          </div>
        </div>

      </div>
    </header>
  );
}
