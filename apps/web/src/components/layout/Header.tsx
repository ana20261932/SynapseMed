import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  user: { firstName?: string; lastName?: string; email?: string } | null;
  practice: { name?: string; organisationType?: string } | null;
  onMenuClick: () => void;
}

export function Header({ user, practice, onMenuClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-clinic-200">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-clinic-100 rounded-lg text-clinic-600 hover:text-clinic-900 transition-colors md:hidden"
            aria-label="Toggle navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 bg-synapse-600 rounded-xl flex items-center justify-center text-white text-lg">
              S
            </div>
            <span className="font-bold text-xl text-clinic-900 tracking-tight">SynapseMed</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-clinic-50 border border-clinic-200 text-clinic-700 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {practice?.name || 'No practice selected'}
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-clinic-50 border border-clinic-200 text-clinic-700 text-sm font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-synapse-500 animate-pulse" />
              <span className="text-clinic-600">Online</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-clinic-50 border border-clinic-200">
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-clinic-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-clinic-500">{user?.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-clinic-200 overflow-hidden flex items-center justify-center">
              <span className="text-sm font-semibold text-clinic-700">
                {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
