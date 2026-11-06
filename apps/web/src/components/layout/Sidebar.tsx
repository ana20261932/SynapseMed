import React, { useState } from 'react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────

interface Practice {
  id: string;
  name: string;
  organisationType: string;
  timezone: string;
  role: string;
  moduleEntitlements?: Array<{ moduleKey: string; status: string }>;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  professionalProfile?: {
    discipline: string;
    registrationStatus: string;
  } | null;
}

interface SidebarProps {
  user: User | null;
  practices: Practice[];
  activePractice: Practice | null;
  onPracticeChange: (practice: Practice | null) => void;
  onLogout: () => void;
  activePath: string;
}

// ── Nav config ─────────────────────────────────────────────────────────────

const DISCIPLINE_HOME: Record<string, string> = {
  medical_practitioner: '/dashboard', general_practice: '/dashboard', specialist: '/dashboard',
  dentist: '/dental', dentistry: '/dental',
  radiologist: '/radiology', radiology: '/radiology',
  psychiatrist: '/psychiatry', psychiatry: '/psychiatry',
  psychologist: '/psychiatry', psychology: '/psychiatry',
  nurse: '/nursing', nursing: '/nursing',
  pharmacist: '/pharmacy', pharmacy: '/pharmacy',
  physiotherapist: '/physiotherapy', physiotherapy: '/physiotherapy',
  occupational_therapist: '/occupational-therapy',
  optometrist: '/optometry', audiologist: '/audiology', dietitian: '/dietetics',
  laboratory_technician: '/laboratory', laboratory: '/laboratory',
};

const DISCIPLINE_ICON: Record<string, string> = {
  dentist: '🦷', dentistry: '🦷',
  radiologist: '🩻', radiology: '🩻',
  psychiatrist: '🧠', psychiatry: '🧠',
  nurse: '💊', nursing: '💊',
  pharmacist: '⚗️', pharmacy: '⚗️',
  laboratory_technician: '🔬', laboratory: '🔬',
};

const DISCIPLINE_LABEL: Record<string, string> = {
  general_practice: 'Practice Overview', medical_practitioner: 'Practice Overview', specialist: 'Practice Overview',
  dentist: 'Dental Chart', dentistry: 'Dental Chart',
  radiologist: 'Radiology Orders', radiology: 'Radiology Orders',
  psychiatrist: 'Mental Health', psychiatry: 'Mental Health',
  nurse: 'Nursing', nursing: 'Nursing',
  pharmacist: 'Pharmacy', pharmacy: 'Pharmacy',
  laboratory_technician: 'Laboratory', laboratory: 'Laboratory',
};

// ── Sidebar Nav Item ────────────────────────────────────────────────────────

function NavItem({
  href,
  label,
  icon,
  active,
  badge,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: string | number;
  collapsed?: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`sk-sidebar-item ${active ? 'sk-sidebar-item-active' : ''}`}
    >
      <span className="shrink-0 w-5 text-center">{icon}</span>
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge !== undefined && (
        <span
          className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent-fg)' }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

// ── Main Sidebar ────────────────────────────────────────────────────────────

export function Sidebar({ user, practices, activePractice, onPracticeChange, onLogout, activePath }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [practiceMenuOpen, setPracticeMenuOpen] = useState(false);

  const discipline = user?.professionalProfile?.discipline?.toLowerCase() || 'general_practice';
  const homeHref   = DISCIPLINE_HOME[discipline] || '/dashboard';
  const homeIcon   = DISCIPLINE_ICON[discipline] || '🏥';
  const homeLabel  = DISCIPLINE_LABEL[discipline] || 'Practice Overview';

  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'U';

  return (
    <aside
      className={`sk-sidebar fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* ── Brand header ── */}
      <div
        className={`flex items-center h-14 px-4 shrink-0 transition-all duration-300 ${collapsed ? 'justify-center' : 'gap-2.5'}`}
        style={{ borderBottom: '1px solid var(--color-border-default)' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ background: 'var(--color-accent-default)' }}
        >
          S
        </div>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight truncate" style={{ color: 'var(--color-fg-default)' }}>
            SynapseMed
          </span>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="sk-btn sk-btn-ghost p-1 ml-auto"
            aria-label="Collapse sidebar"
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="sk-btn sk-btn-ghost p-1 absolute"
            aria-label="Expand sidebar"
            style={{ borderRadius: 'var(--radius-sm)', top: '0.85rem', left: '0.85rem' }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--color-accent-default)' }}>S</div>
          </button>
        )}
      </div>

      {/* ── Practice switcher ── */}
      {!collapsed && (
        <div className="px-3 py-3 shrink-0" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
          <button
            onClick={() => setPracticeMenuOpen(!practiceMenuOpen)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border-default)',
              color: 'var(--color-fg-default)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-fg-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="flex-1 text-left truncate text-xs">{activePractice?.name || 'Select practice'}</span>
            <svg className="w-3 h-3 shrink-0" style={{ color: 'var(--color-fg-subtle)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {practiceMenuOpen && practices.length > 0 && (
            <div
              className="mt-1 rounded-xl overflow-hidden"
              style={{
                border: '1px solid var(--color-border-default)',
                background: 'var(--color-bg-surface)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {practices.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { onPracticeChange(p); setPracticeMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors text-left"
                  style={{
                    color: activePractice?.id === p.id ? 'var(--color-accent-fg)' : 'var(--color-fg-muted)',
                    background: activePractice?.id === p.id ? 'var(--color-accent-subtle)' : 'transparent',
                  }}
                >
                  <span className="flex-1 truncate">{p.name}</span>
                  <span
                    className="capitalize px-1.5 py-0.5 rounded-full font-medium"
                    style={{ fontSize: 10, background: 'var(--color-bg-muted)', color: 'var(--color-fg-subtle)' }}
                  >
                    {p.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className={`flex-1 overflow-y-auto py-3 ${collapsed ? 'px-2' : 'px-3'}`}>
        {!collapsed && (
          <p className="sk-sidebar-group-label">Navigation</p>
        )}
        <div className="space-y-0.5">
          <NavItem href={homeHref}      label={homeLabel}         icon={homeIcon}  active={activePath === homeHref}      collapsed={collapsed} />
          <NavItem href="/patients"     label="Patients"          icon="👤"         active={activePath === '/patients'}    collapsed={collapsed} />
          <NavItem href="/appointments" label="Appointments"      icon="📅"         active={activePath === '/appointments'} collapsed={collapsed} />
          <NavItem href="/billing"      label="Billing & Claims"  icon="💳"         active={activePath === '/billing'}     collapsed={collapsed} />
          {!collapsed && <>
            <p className="sk-sidebar-group-label">Settings</p>
          </>}
          <NavItem href="/account"      label="Practice Account"  icon="🏢"         active={activePath === '/account'}     collapsed={collapsed} />
          <NavItem href="/settings/ai"  label="AI & Automation"   icon="⚙️"         active={activePath === '/settings/ai'} collapsed={collapsed} />
        </div>
      </nav>

      {/* ── Footer ── */}
      <div
        className={`shrink-0 ${collapsed ? 'px-2 py-3' : 'px-3 py-3'}`}
        style={{ borderTop: '1px solid var(--color-border-default)' }}
      >
        {!collapsed && user && (
          <div
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-1"
            style={{ background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent-fg)' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-fg-default)' }}>
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'var(--color-fg-subtle)' }}>
                {user.email}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          title={collapsed ? 'Sign out' : undefined}
          className={`w-full sk-sidebar-item text-xs font-medium`}
          style={{ color: 'var(--color-danger-fg)' }}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
