import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

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

const PROFESSION_NAV: Record<string, { icon: string; label: string; path: string; modules: string[] }> = {
  general_practice: {
    icon: '🏥',
    label: 'Practice Overview',
    path: '/dashboard',
    modules: ['scheduling', 'clinical_notes', 'billing'],
  },
  dentistry: {
    icon: '🦷',
    label: 'Dental Chart',
    path: '/dental',
    modules: ['dental_odontogram', 'dental_procedures', 'dental_imaging'],
  },
  radiology: {
    icon: '📻',
    label: 'Radiology Orders',
    path: '/radiology',
    modules: ['radiology_orders', 'radiology_reports', 'imaging_worklist'],
  },
  psychiatry: {
    icon: '🧠',
    label: 'Mental Health',
    path: '/psychiatry',
    modules: ['mental_health_records', 'treatment_plans'],
  },
  psychology: {
    icon: '🧠',
    label: 'Psychology Sessions',
    path: '/psychology',
    modules: ['mental_health_records', 'treatment_plans'],
  },
  nursing: {
    icon: '👩‍⚕️',
    label: 'Nursing Observations',
    path: '/nursing',
    modules: ['nursing_observations', 'care_plans'],
  },
  pharmacy: {
    icon: '💊',
    label: 'Pharmacy Stock',
    path: '/pharmacy',
    modules: ['pharmacy_inventory', 'medication_workflow'],
  },
  physiotherapy: {
    icon: '🦿',
    label: 'Physio Assessments',
    path: '/physiotherapy',
    modules: ['physio_assessments', 'rehab_plans'],
  },
  occupational_therapy: {
    icon: '🤝',
    label: 'OT Sessions',
    path: '/occupational-therapy',
    modules: ['ot_assessments', 'care_plans'],
  },
  optometry: {
    icon: '👁️',
    label: 'Eye Care',
    path: '/optometry',
    modules: ['vision_tests', 'prescriptions'],
  },
  audiology: {
    icon: '👂',
    label: 'Audiology',
    path: '/audiology',
    modules: ['hearing_tests', 'assessments'],
  },
  dietetics: {
    icon: '🥗',
    label: 'Dietitian Plans',
    path: '/dietetics',
    modules: ['nutrition_assessments', 'meal_plans'],
  },
  laboratory: {
    icon: '🔬',
    label: 'Laboratory Orders',
    path: '/laboratory',
    modules: ['lab_orders', 'specimen_tracking', 'results'],
  },
  hospital: {
    icon: '🏥',
    label: 'Hospital Dashboard',
    path: '/hospital',
    modules: ['departments', 'beds', 'encounters', 'referrals'],
  },
  clinic: {
    icon: '🏥',
    label: 'Clinic Dashboard',
    path: '/clinic',
    modules: ['scheduling', 'clinical_notes', 'billing'],
  },
};

const DISCIPLINE_PATHS: Record<string, string> = {
  'medical_practitioner': '/dashboard',
  'general_practice': '/dashboard',
  'specialist': '/dashboard',
  'dentist': '/dental',
  'dentistry': '/dental',
  'radiologist': '/radiology',
  'radiology': '/radiology',
  'psychiatrist': '/psychiatry',
  'psychiatry': '/psychiatry',
  'psychologist': '/psychology',
  'psychology': '/psychology',
  'nurse': '/nursing',
  'nursing': '/nursing',
  'pharmacist': '/pharmacy',
  'pharmacy': '/pharmacy',
  'physiotherapist': '/physiotherapy',
  'physiotherapy': '/physiotherapy',
  'occupational_therapist': '/occupational-therapy',
  'optometrist': '/optometry',
  'audiologist': '/audiology',
  'dietitian': '/dietetics',
  'laboratory_technician': '/laboratory',
  'laboratory': '/laboratory',
};

export function Sidebar({ user, practices, activePractice, onPracticeChange, onLogout, activePath }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [practiceMenuOpen, setPracticeMenuOpen] = useState(false);

  const discipline = user?.professionalProfile?.discipline?.toLowerCase() || '';
  const professionNav = PROFESSION_NAV[discipline] || PROFESSION_NAV.general_practice;
  const defaultPath = DISCIPLINE_PATHS[discipline] || '/dashboard';

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 border-r border-clinic-200 bg-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-72'
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div className={`flex items-center justify-center h-16 px-4 border-b border-clinic-100 transition-all duration-300 ${collapsed ? 'justify-center px-2' : 'justify-start px-6'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-synapse-600 rounded-xl flex items-center justify-center text-white text-lg">
                S
              </div>
              <span className="font-bold text-xl text-clinic-900 tracking-tight">SynapseMed</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-synapse-600 rounded-xl flex items-center justify-center text-white text-lg">
              S
            </div>
          )}
        </div>

        {/* Practice Switcher */}
        <div className={`px-4 py-4 border-b border-clinic-100 transition-all duration-300 ${collapsed ? 'hidden' : 'block'}`}>
          <button
            onClick={() => setPracticeMenuOpen(!practiceMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-clinic-200 bg-clinic-50 text-clinic-700 text-sm font-medium transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {activePractice?.name || 'Select practice'}
            </span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {practiceMenuOpen && practices.length > 0 && (
            <div className="mt-2 space-y-1 max-h-60 overflow-y-auto border border-clinic-200 rounded-xl bg-white shadow-card">
              {practices.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { onPracticeChange(p); setPracticeMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    activePractice?.id === p.id ? 'bg-synapse-50 text-synapse-700' : 'text-clinic-600 hover:bg-clinic-50 hover:text-clinic-900'
                  }`}
                >
                  <svg className={`w-4 h-4 ${
                    activePractice?.id === p.id ? 'text-synapse-600' : 'text-clinic-400'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {p.name}
                  <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full border text-clinic-500 border-clinic-200 capitalize">{p.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-4 pb-4'}`}>
          {!collapsed && (
            <div className="mb-4">
              <p className="text-[10px] font-semibold text-clinic-400 uppercase tracking-wider mb-3 px-2">Practice Navigator</p>
            </div>
          )}
          <div className="space-y-1">
            <Link
              href={defaultPath}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                activePath === defaultPath ? 'bg-synapse-50 text-synapse-700' : 'text-clinic-600 hover:bg-clinic-50 hover:text-clinic-900'
              }`}
            >
              <span className="w-8 text-center">{professionNav.icon}</span>
              {collapsed ? '' : professionNav.label}
            </Link>
            {!collapsed && (
              <>
                <Link
                  href="/patients"
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    activePath === '/patients' ? 'bg-synapse-50 text-synapse-700' : 'text-clinic-600 hover:bg-clinic-50 hover:text-clinic-900'
                  }`}
                >
                  <span className="w-8 text-center">👤</span>
                  Patients
                </Link>
                <Link
                  href="/appointments"
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    activePath === '/appointments' ? 'bg-synapse-50 text-synapse-700' : 'text-clinic-600 hover:bg-clinic-50 hover:text-clinic-900'
                  }`}
                >
                  <span className="w-8 text-center">📅</span>
                  Appointments
                </Link>
                <Link
                  href="/billing"
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    activePath === '/billing' ? 'bg-synapse-50 text-synapse-700' : 'text-clinic-600 hover:bg-clinic-50 hover:text-clinic-900'
                  }`}
                >
                  <span className="w-8 text-center">💳</span>
                  Billing
                </Link>
                <Link
                  href="/account"
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    activePath === '/account' ? 'bg-synapse-50 text-synapse-700' : 'text-clinic-600 hover:bg-clinic-50 hover:text-clinic-900'
                  }`}
                >
                  <span className="w-8 text-center">🏢</span>
                  Practice Account
                </Link>
                <Link
                  href="/settings/ai"
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    activePath === '/settings/ai' ? 'bg-synapse-50 text-synapse-700' : 'text-clinic-600 hover:bg-clinic-50 hover:text-clinic-900'
                  }`}
                >
                  <span className="w-8 text-center">⚙️</span>
                  AI & Automation
                </Link>
              </>
            )}
          </div>

          {collapsed ? (
            <div className="mt-auto pt-4 border-t border-clinic-100">
              <button
                onClick={() => setCollapsed(false)}
                className="flex items-center justify-center gap-2 w-full px-3 py-3 rounded-xl text-clinic-600 hover:bg-clinic-50 transition-colors"
                title="Expand sidebar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="mt-auto pt-6 border-t border-clinic-100">
              <div className="px-2">
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-clinic-600 hover:bg-clinic-50 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-clinic-200 overflow-hidden flex items-center justify-center">
                    <span className="text-sm font-semibold text-clinic-700">
                      {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-clinic-900 truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-clinic-500 truncate">{user?.email}</p>
                  </div>
                  <svg className="w-4 h-4 text-clinic-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="mt-3 w-full flex items-center justify-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}
