import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/apiClient';
import { Layout } from '@/components/layout/Layout';
import { Card, Button, Badge, Avatar, StatCard, Alert } from '@/components/ui';

interface User { id: string; email: string; firstName: string; lastName: string; }
interface Practice { id: string; name: string; role: string; }
interface Patient { id: string; firstName: string; lastName: string; dateOfBirth?: string; phone?: string; email?: string; status: string; medicalAidNumber?: string; }
interface Appointment { id: string; patientId: string; appointmentType?: string; location?: string; startsAt: string; endsAt: string; status: string; notes?: string; }

const STATUS_COLORS: Record<string, string> = {
  booked: 'bg-blue-50 text-blue-700 border-blue-100',
  checked_in: 'bg-synapse-50 text-synapse-700 border-synapse-100',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-100',
  completed: 'bg-green-50 text-green-700 border-green-100',
  cancelled: 'bg-red-50 text-red-700 border-red-100',
  no_show: 'bg-clinic-100 text-clinic-600 border-clinic-200',
};

export default function PatientDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

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
    // Patient dashboard: load the user's own patient record + appointments
    apiClient.get<Patient[]>(`/api/v1/practices/${activePractice.id}/patients`, token)
      .then((pts) => {
        const own = pts.find(p => p.email === user?.email || p.phone === user?.email) ?? pts[0];
        setPatient(own ?? null);
      })
      .catch(() => setPatient(null));
    apiClient.get<Appointment[]>(`/api/v1/practices/${activePractice.id}/appointments`, token)
      .then(setAppointments)
      .catch(() => setAppointments([]));
  }, [activePractice, user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;

  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.startsAt.startsWith(today) && a.status !== 'cancelled');
  const upcoming = appointments.filter(a => a.status === 'booked').sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 5);

  function handlePracticeChange(practice: Practice | null) { setActivePractice(practice); }
  function logout() { localStorage.clear(); router.push('/login'); }

  return (
    <>
      <Head><title>Patient Portal — SynapseMed</title></Head>
      <Layout
        user={user}
        practices={practices}
        activePractice={activePractice}
        onPracticeChange={handlePracticeChange}
        onLogout={logout}
      >
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-clinic-900">Patient Portal</h1>
              <p className="text-clinic-500 text-sm">{activePractice?.name} • Your health records and appointments</p>
            </div>
            <div className="flex gap-3">
              <Badge variant="verified" className="text-[12px] px-3 py-1.5">ACTIVE PATIENT</Badge>
              <Button variant="outline">My Profile</Button>
            </div>
          </div>
          <div className="dev-banner mt-4">
            ⚠️ Development environment — synthetic data only. Not for clinical use.
          </div>
        </div>

        {/* Welcome banner */}
        <Card className="mb-8 bg-synapse-50 border-synapse-100">
          <div className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-synapse-600 flex items-center justify-center text-white text-xl">👋</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-clinic-900">Welcome back, {patient?.firstName || user?.firstName || 'Patient'}</h2>
              <p className="text-clinic-600 text-sm">{patient ? `Medical Aid: ${patient.medicalAidNumber || 'Not on file'}` : 'Manage your health records here.'}</p>
            </div>
            <Button variant="outline" size="sm">Book Appointment</Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard title="Upcoming Appointments" value={upcoming.length} trend="neutral" icon={<span className="w-6 h-6 text-blue-600">📅</span>} />
          <StatCard title="Today" value={todayAppts.length} trend="neutral" icon={<span className="w-6 h-6 text-synapse-600">🏥</span>} />
          <StatCard title="Records" value="12" trend="neutral" icon={<span className="w-6 h-6 text-clinic-600">📄</span>} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming appointments */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-clinic-900">Upcoming Appointments</h2>
              <Link href="/appointments" className="text-sm text-synapse-600 hover:underline font-medium">View all →</Link>
            </div>
            {upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-clinic-200 bg-white">
                    <div className="flex items-center gap-4">
                      <Avatar size="md" label="P" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-clinic-900">{a.appointmentType ? a.appointmentType.replace(/_/g, ' ') : 'General Consultation'}</p>
                        <p className="text-xs text-clinic-500">{a.location || 'Clinic'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-clinic-900">{new Date(a.startsAt).toLocaleDateString()}</p>
                      <p className="text-xs text-clinic-500">{new Date(a.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <Badge variant="default" className={[STATUS_COLORS[a.status], 'text-[10px] px-2 py-1 mt-1'].join(' ')}>{a.status.toUpperCase()}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center rounded-xl border border-dashed border-clinic-200 bg-clinic-50 text-clinic-400 text-sm">
                No upcoming appointments. <Link href="/appointments" className="text-synapse-600 hover:underline font-medium">Book one</Link>.
              </div>
            )}
          </Card>

          {/* Quick actions */}
          <Card className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-clinic-900 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full text-left justify-start">
                <span className="text-2xl mb-1 block">📅</span>
                Book Appointment
              </Button>
              <Button variant="outline" className="w-full text-left justify-start">
                <span className="text-2xl mb-1 block">📄</span>
                View Medical Records
              </Button>
              <Button variant="outline" className="w-full text-left justify-start">
                <span className="text-2xl mb-1 block">💳</span>
                Bills & Payments
              </Button>
              <Button variant="outline" className="w-full text-left justify-start">
                <span className="text-2xl mb-1 block">✉️</span>
                Messages
              </Button>
            </div>
          </Card>

          {/* Health summary */}
          <Card className="lg:col-span-1 mt-0 lg:mt-auto">
            <h2 className="text-lg font-semibold text-clinic-900 mb-6">Health Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl border border-clinic-200 bg-clinic-50">
                <span className="text-sm text-clinic-600">Last visit</span>
                <span className="text-sm font-semibold text-clinic-900">{todayAppts.length > 0 ? 'Today' : '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-clinic-200 bg-clinic-50">
                <span className="text-sm text-clinic-600">Next appointment</span>
                <span className="text-sm font-semibold text-clinic-900">{upcoming.length > 0 ? new Date(upcoming[0].startsAt).toLocaleDateString() : 'None scheduled'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-clinic-200 bg-clinic-50">
                <span className="text-sm text-clinic-600">Medical aid</span>
                <span className="text-sm font-semibold text-clinic-900 truncate">{patient?.medicalAidNumber || 'Not on file'}</span>
              </div>
            </div>
          </Card>
        </div>

        <Alert variant="info" title="Patient portal" className="mt-8 max-w-md">
          View your upcoming appointments, book new visits, and access your medical records. All data is synthetic in this development environment.
        </Alert>
      </Layout>
    </>
  );
}
