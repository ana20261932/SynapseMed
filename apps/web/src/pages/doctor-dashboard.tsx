import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/apiClient';
import { Layout } from '@/components/layout/Layout';
import { Card, Button, Badge, Avatar, StatCard, Alert } from '@/components/ui';

interface User { id: string; email: string; firstName: string; lastName: string; professionalProfile?: { discipline: string; registrationStatus: string; } | null; }
interface Practice { id: string; name: string; role: string; moduleEntitlements?: Array<{ moduleKey: string; status: string }>; }
interface Patient { id: string; firstName: string; lastName: string; dateOfBirth?: string; phone?: string; email?: string; status: string; }
interface Appointment { id: string; patientId: string; patient?: Patient; appointmentType?: string; location?: string; startsAt: string; endsAt: string; status: string; notes?: string; }

const STATUS_COLORS: Record<string, string> = {
  booked: 'bg-blue-50 text-blue-700 border-blue-100',
  checked_in: 'bg-synapse-50 text-synapse-700 border-synapse-100',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-100',
  completed: 'bg-green-50 text-green-700 border-green-100',
  cancelled: 'bg-red-50 text-red-700 border-red-100',
  no_show: 'bg-clinic-100 text-clinic-600 border-clinic-200',
};

export default function DoctorDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
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
    Promise.all([
      apiClient.get<Patient[]>(`/api/v1/practices/${activePractice.id}/patients`, token),
      apiClient.get<Appointment[]>(`/api/v1/practices/${activePractice.id}/appointments`, token),
    ])
      .then(([pts, appts]) => { setPatients(pts); setAppointments(appts); })
      .catch(() => { setPatients([]); setAppointments([]); });
  }, [activePractice]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;

  const discipline = user?.professionalProfile?.discipline?.toLowerCase() || 'general_practice';
  const professionLabel = discipline.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.startsAt.startsWith(today));
  const pendingAppts = appointments.filter(a => a.status === 'booked');
  const activeModules = activePractice?.moduleEntitlements?.filter(m => m.status === 'active').length || 0;

  function handlePracticeChange(practice: Practice | null) { setActivePractice(practice); }
  function logout() { localStorage.clear(); router.push('/login'); }

  const upcoming = todayAppts.slice(0, 5);

  return (
    <>
      <Head><title>Doctor Dashboard — SynapseMed</title></Head>
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
              <h1 className="text-3xl font-bold text-clinic-900">Doctor Dashboard</h1>
              <p className="text-clinic-500 text-sm">{activePractice?.name} • {professionLabel}</p>
            </div>
            <div className="flex gap-3">
              <Badge variant={user?.professionalProfile?.registrationStatus === 'verified' ? 'verified' : 'warning'} className="text-[12px] px-3 py-1.5">
                {user?.professionalProfile?.registrationStatus?.replace(/_/g, ' ').toUpperCase() || 'UNVERIFIED'}
              </Badge>
              <Button variant="outline">My Profile</Button>
            </div>
          </div>
          <div className="dev-banner mt-4">
            ⚠️ Development environment — synthetic data only. Not for clinical use.
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Today's Appointments" value={todayAppts.length} change="+2" trend="up" icon={<span className="w-6 h-6 text-synapse-600">📅</span>} />
          <StatCard title="Pending" value={pendingAppts.length} trend="neutral" icon={<span className="w-6 h-6 text-amber-600">⏳</span>} />
          <StatCard title="My Patients" value={patients.length} trend="neutral" icon={<span className="w-6 h-6 text-synapse-600">👤</span>} />
          <StatCard title="Active Modules" value={activeModules} trend="neutral" icon={<span className="w-6 h-6 text-clinic-600">🔧</span>} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's schedule */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-clinic-900">Today's Schedule</h2>
              <Link href="/appointments" className="text-sm text-synapse-600 hover:underline font-medium">View all →</Link>
            </div>
            {todayAppts.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map((a) => {
                  const p = patients.find(pt => pt.id === a.patientId);
                  return (
                    <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-clinic-200 bg-white hover:bg-clinic-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar size="md" label={`${p?.firstName.charAt(0)}${p?.lastName.charAt(0)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-clinic-900 truncate">{p ? `${p.firstName} ${p.lastName}` : 'Unknown Patient'}</p>
                          <p className="text-xs text-clinic-500">{a.appointmentType ? a.appointmentType.replace(/_/g, ' ') : 'General'} • {a.location || 'Clinic'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-clinic-900">{new Date(a.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <Badge variant="default" className={[STATUS_COLORS[a.status], 'text-[10px] px-2 py-1'].join(' ')}>{a.status.toUpperCase()}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center rounded-xl border border-dashed border-clinic-200 bg-clinic-50 text-clinic-400 text-sm">
                No appointments scheduled for today.
              </div>
            )}
          </Card>

          {/* Quick actions */}
          <Card className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-clinic-900 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full text-left justify-start" onClick={() => router.push('/patients')}>
                <span className="text-2xl mb-1 block">👤</span>
                Manage Patients
              </Button>
              <Button variant="outline" className="w-full text-left justify-start" onClick={() => router.push('/appointments')}>
                <span className="text-2xl mb-1 block">📅</span>
                Appointments
              </Button>
              <Button variant="outline" className="w-full text-left justify-start" onClick={() => router.push('/billing')}>
                <span className="text-2xl mb-1 block">💳</span>
                Billing & Claims
              </Button>
              <Button variant="outline" className="w-full text-left justify-start">
                <span className="text-2xl mb-1 block">📋</span>
                Clinical Notes
              </Button>
            </div>
          </Card>

          {/* At a glance */}
          <Card className="lg:col-span-1 mt-0 lg:mt-auto">
            <h2 className="text-lg font-semibold text-clinic-900 mb-6">At a Glance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl border border-clinic-200 bg-clinic-50">
                <span className="text-sm text-clinic-600">Total patients</span>
                <span className="text-sm font-semibold text-clinic-900">{patients.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-clinic-200 bg-clinic-50">
                <span className="text-sm text-clinic-600">Due today</span>
                <span className="text-sm font-semibold text-synapse-600">{todayAppts.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-clinic-200 bg-clinic-50">
                <span className="text-sm text-clinic-600">Active modules</span>
                <span className="text-sm font-semibold text-clinic-900">{activeModules}</span>
              </div>
            </div>
          </Card>
        </div>

        <Alert variant="info" title="Practitioner view" className="mt-8 max-w-md">
          Switch dashboard shows your personal schedule, patient list, and quick actions for {professionLabel.toLowerCase()}.
        </Alert>
      </Layout>
    </>
  );
}
