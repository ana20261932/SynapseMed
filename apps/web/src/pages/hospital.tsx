import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/apiClient';
import { Layout } from '@/components/layout/Layout';
import { Card, Button, Input, Badge, Table } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';

interface User { id: string; email: string; firstName: string; lastName: string; }
interface Practice { id: string; name: string; role: string; }

export default function HospitalPage() {
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

  const departments = [
    { name: 'Emergency', beds: 24, occupied: 12, status: 'busy' as const },
    { name: 'Cardiology', beds: 30, occupied: 18, status: 'normal' as const },
    { name: 'Maternity', beds: 20, occupied: 8, status: 'normal' as const },
    { name: 'Surgery', beds: 16, occupied: 14, status: 'full' as const },
    { name: 'Pediatrics', beds: 15, occupied: 6, status: 'normal' as const },
    { name: 'ICU', beds: 8, occupied: 7, status: 'critical' as const },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;

  return (
    <>
      <Head><title>Hospital — SynapseMed</title></Head>
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
              <h1 className="text-3xl font-bold text-clinic-900">Hospital Dashboard</h1>
              <p className="text-clinic-500 text-sm">Departments, beds, encounters and referrals</p>
            </div>
            <Button variant="primary">+ New Encounter</Button>
          </div>
          <div className="dev-banner mt-4">
            ⚠️ Development environment — synthetic data only. Not for clinical use. Hospital module.
          </div>
        </div>

        {/* Department overview */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-clinic-900">Department Overview</h2>
              <p className="text-clinic-500 text-sm">Bed occupancy and department status</p>
            </div>
          </div>
          <div className="space-y-3">
            {departments.map(dept => {
              const occPct = Math.round((dept.occupied / dept.beds) * 100);
              const statusColors: Record<string, string> = {
                normal: 'bg-green-50 text-green-700 border-green-100',
                busy: 'bg-amber-50 text-amber-700 border-amber-100',
                full: 'bg-red-50 text-red-700 border-red-100',
                critical: 'bg-red-100 text-red-800 border-red-200',
              };
              return (
                <div key={dept.name} className="flex items-center justify-between p-4 rounded-xl border border-clinic-200 bg-white">
                  <div>
                    <span className="font-medium text-clinic-900">{dept.name}</span>
                    <p className="text-xs text-clinic-500 mt-0.5">{dept.beds} beds</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-clinic-200 rounded-full h-2">
                      <div className={`bg-synapse-600 h-2 rounded-full`} style={{ width: `${occPct}%` }} />
                    </div>
                    <span className={`text-xs font-medium border rounded-full px-2 py-0.5 ${statusColors[dept.status]}`}>
                      {dept.status.toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-clinic-900">{dept.occupied}/{dept.beds}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Quick actions grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[{
            label: 'Admissions',
            icon: '📥',
            color: 'bg-synapse-50 text-synapse-600',
          }, {
            label: 'Discharges',
            icon: '📤',
            color: 'bg-green-50 text-green-600',
          }, {
            label: 'Transfers',
            icon: '🔄',
            color: 'bg-amber-50 text-amber-600',
          }, {
            label: 'Referrals',
            icon: '➡️',
            color: 'bg-blue-50 text-blue-600',
          }].map((item, i) => (
            <Card key={item.label} className="cursor-pointer hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-clinic-500 text-sm mt-2">{item.label}</p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.color}`} />
              </div>
            </Card>
          ))}
        </div>
      </Layout>
    </>
  );
}
