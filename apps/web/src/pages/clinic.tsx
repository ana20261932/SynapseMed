import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/apiClient';
import { Layout } from '@/components/layout/Layout';
import { Card, Button, Input, Badge, Table } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';

interface User { id: string; email: string; firstName: string; lastName: string; }
interface Practice { id: string; name: string; role: string; }

export default function ClinicPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;

  return (
    <>
      <Head><title>Clinic — SynapseMed</title></Head>
      <Layout
        user={user}
        practices={practices}
        activePractice={activePractice}
        onPracticeChange={(p) => setActivePractice(p)}
        onLogout={() => { localStorage.clear(); router.push('/login'); }}
      >
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-clinic-900">Clinic Dashboard</h1>
              <p className="text-clinic-500 text-sm">Multidisciplinary clinic workflow and scheduling</p>
            </div>
            <Button variant="primary">+ New Encounter</Button>
          </div>
          <div className="dev-banner mt-4">
            ⚠️ Development environment — synthetic data only. Not for clinical use. Clinic module.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-clinic-900 mb-4">Today's Schedule</h2>
            <div className="space-y-3">
              {[
                { time: '09:00', patient: 'J. Smith', type: 'General Consultation', dr: 'Dr. Adams' },
                { time: '09:30', patient: 'M. Jones', type: 'Follow-up', dr: 'Dr. Baker' },
                { time: '10:00', patient: 'R. Patel', type: 'Vital Signs', dr: 'Nurse Clark' },
              ].map((a, i) => (
                <div key={i} className="p-3 rounded-xl border border-clinic-200 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-clinic-500">{a.time}</span>
                    <span className="text-xs bg-synapse-50 text-synapse-700 border border-synapse-100 rounded-full px-2 py-0.5">Booked</span>
                  </div>
                  <p className="text-sm font-medium text-clinic-900 mt-1">{a.patient}</p>
                  <p className="text-xs text-clinic-500">{a.type} • {a.dr}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-clinic-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">Check-in Patient</Button>
              <Button variant="outline" className="w-full justify-start">Room Assignment</Button>
              <Button variant="outline" className="w-full justify-start">Daily Rounds</Button>
              <Button variant="outline" className="w-full justify-start">End of Day Summary</Button>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-clinic-900 mb-4">Practice Info</h2>
            <p className="text-sm text-clinic-600">{activePractice?.name}</p>
            <p className="text-xs text-clinic-500 mt-2">Role: {activePractice?.role}</p>
          </Card>
        </div>
      </Layout>
    </>
  );
}
