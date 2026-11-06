import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/apiClient';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, StatCard, Badge, Button, Table } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';

interface User { id: string; email: string; firstName: string; lastName: string; professionalProfile?: { discipline: string; registrationStatus: string; } | null; }
interface Practice { id: string; name: string; organisationType: string; timezone: string; role: string; moduleEntitlements?: Array<{ moduleKey: string; status: string }>; }
interface Patient { id: string; firstName: string; lastName: string; dateOfBirth?: string; phone?: string; email?: string; status: string; }

interface QuickPatientForm { firstName: string; lastName: string; dateOfBirth: string; phone: string; email: string; medicalAidNumber: string; }

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [patientForm, setPatientForm] = useState<QuickPatientForm>({ firstName: '', lastName: '', dateOfBirth: '', phone: '', email: '', medicalAidNumber: '' });
  const [patientError, setPatientError] = useState('');
  const [patientAdding, setPatientAdding] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    Promise.all([
      apiClient.get<User>('/api/v1/auth/me', token),
      apiClient.get<Practice[]>('/api/v1/practices', token),
    ])
      .then(([u, p]) => {
        setUser(u);
        setPractices(p);
        if (p.length > 0) setActivePractice(p[0]);
      })
      .catch(() => { localStorage.removeItem('accessToken'); router.push('/login'); })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!activePractice) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    apiClient.get<Patient[]>(`/api/v1/practices/${activePractice.id}/patients`, token)
      .then(setPatients)
      .catch(() => setPatients([]));
  }, [activePractice]);

  const discipline = user?.professionalProfile?.discipline?.toLowerCase() || 'general_practice';
  const professionLabel = discipline.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  function handlePracticeChange(practice: Practice | null) {
    setActivePractice(practice);
  }

  function logout() {
    localStorage.clear();
    router.push('/login');
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Not authenticated</div>;

  const activeModules = activePractice?.moduleEntitlements?.filter(m => m.status === 'active').length || 0;

  return (
    <>
      <Head>
        <title>Dashboard — SynapseMed</title>
      </Head>
      <Layout
        user={user}
        practices={practices}
        activePractice={activePractice}
        onPracticeChange={handlePracticeChange}
        onLogout={logout}
      >
        <div className="py-8">
          {/* ── Header ── */}
          <div className="flex items-start justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-fg-default)' }}>
                Practice Dashboard
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)' }}>
                {activePractice?.name} &middot; {professionLabel} &middot;{' '}
                <span className="capitalize">{activePractice?.role}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={user?.professionalProfile?.registrationStatus === 'verified' ? 'verified' : 'warning'}>
                {user?.professionalProfile?.registrationStatus?.replace(/_/g, ' ').toUpperCase() || 'UNVERIFIED'}
              </Badge>
              <Button size="sm" variant="primary" onClick={() => setAddPatientOpen(true)}>
                + New Patient
              </Button>
            </div>
          </div>

          {/* ── Dev banner ── */}
          <div className="sk-dev-banner mb-6">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Development environment — synthetic data only. Not for clinical use.
          </div>

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
            <StatCard title="Total Patients"       value={patients.length} change="+12"  trend="up"      description="vs last month" />
            <StatCard title="Active Modules"       value={activeModules}   trend="neutral" />
            <StatCard title="Today's Appointments" value={8}               change="+3"   trend="up"      description="today" />
            <StatCard title="Pending Claims"       value={2}               change="−1"   trend="down"    description="vs yesterday" />
          </div>

          {/* ── Quick Actions ── */}
          <Card className="mb-7">
            <CardTitle className="mb-1">Quick Actions</CardTitle>
            <p className="text-sm mb-4" style={{ color: 'var(--color-fg-muted)' }}>
              Common tasks for {professionLabel.toLowerCase()}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: '👤', label: 'Patients',       path: '/patients' },
                { icon: '📅', label: 'Appointments',   path: '/appointments' },
                { icon: '💳', label: 'Billing',        path: '/billing' },
                { icon: '📋', label: 'Clinical Notes', path: '' },
              ].map(({ icon, label, path }) => (
                <button
                  key={label}
                  onClick={() => path && router.push(path)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all duration-150 text-center"
                  style={{
                    background: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border-default)',
                    color: 'var(--color-fg-default)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: path ? 'pointer' : 'default',
                  }}
                >
                  <span className="text-2xl">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* ── Recent Patients ── */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-fg-default)' }}>Recent Patients</h2>
            <Link href="/patients" className="text-sm font-medium" style={{ color: 'var(--color-accent-fg)' }}>View all →</Link>
          </div>
          <Table
            columns={['Name', 'Date of Birth', 'Phone', 'Status']}
            data={patients.slice(0, 5)}
            renderCell={(row, col) => {
              if (col === 'Name') return <span className="font-medium text-clinic-900">{row.firstName} {row.lastName}</span>;
              if (col === 'Date of Birth') return <span className="text-clinic-600">{row.dateOfBirth ? new Date(row.dateOfBirth as string).toLocaleDateString() : '-'}</span>;
              if (col === 'Phone') return <span className="text-clinic-600">{row.phone || '-'}</span>;
              if (col === 'Status') return <Badge variant={row.status === 'active' ? 'verified' : 'default'}>{row.status}</Badge>;
              return String(row[col]);
            }}
            emptyMessage="No patients registered yet."
          />
        </div>

        <Modal
          isOpen={addPatientOpen}
          onClose={() => { if (!patientAdding) { setAddPatientOpen(false); setPatientError(''); } }}
          title="Register New Patient"
          size="lg"
        >
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            if (!activePractice) return;
            const token = localStorage.getItem('accessToken');
            if (!token) return;
            setPatientAdding(true); setPatientError('');
            try {
              const created = await apiClient.post<Patient>(`/api/v1/practices/${activePractice.id}/patients`, {
                firstName: patientForm.firstName,
                lastName: patientForm.lastName,
                dateOfBirth: patientForm.dateOfBirth || undefined,
                phone: patientForm.phone || undefined,
                email: patientForm.email || undefined,
                medicalAidNumber: patientForm.medicalAidNumber || undefined,
              }, token);
              setPatients(prev => [created, ...prev]);
              setAddPatientOpen(false);
              setPatientForm({ firstName: '', lastName: '', dateOfBirth: '', phone: '', email: '', medicalAidNumber: '' });
            } catch (err: unknown) {
              setPatientError(err instanceof Error ? err.message : 'Failed to register patient');
            } finally {
              setPatientAdding(false);
            }
          }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-clinic-700 mb-1">First Name</label>
                <input type="text" value={patientForm.firstName} onChange={e => setPatientForm(p => ({ ...p, firstName: e.target.value }))} className="w-full border border-clinic-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-clinic-700 mb-1">Last Name</label>
                <input type="text" value={patientForm.lastName} onChange={e => setPatientForm(p => ({ ...p, lastName: e.target.value }))} className="w-full border border-clinic-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-clinic-700 mb-1">Date of Birth</label>
                <input type="date" value={patientForm.dateOfBirth} onChange={e => setPatientForm(p => ({ ...p, dateOfBirth: e.target.value }))} className="w-full border border-clinic-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-clinic-700 mb-1">Phone</label>
                <input type="tel" value={patientForm.phone} onChange={e => setPatientForm(p => ({ ...p, phone: e.target.value }))} className="w-full border border-clinic-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-clinic-700 mb-1">Email</label>
                <input type="email" value={patientForm.email} onChange={e => setPatientForm(p => ({ ...p, email: e.target.value }))} className="w-full border border-clinic-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-clinic-700 mb-1">Medical Aid Number</label>
                <input type="text" value={patientForm.medicalAidNumber} onChange={e => setPatientForm(p => ({ ...p, medicalAidNumber: e.target.value }))} className="w-full border border-clinic-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500" placeholder="Optional" />
              </div>
            </div>
            {patientError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{patientError}</div>}
            <div className="flex justify-end gap-3 pt-4 border-t border-clinic-100">
              <Button variant="outline" onClick={() => { setAddPatientOpen(false); setPatientError(''); }} disabled={patientAdding}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={patientAdding}>{patientAdding ? 'Registering…' : 'Register Patient'}</Button>
            </div>
          </form>
        </Modal>
      </Layout>
    </>
  );
}
