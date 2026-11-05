import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import { Card, Button, Badge } from '@/components/ui';
import { apiClient } from '@/lib/apiClient';

interface User { id: string; email: string; firstName: string; lastName: string; }
interface Practice { id: string; name: string; role: string; }

export default function ERPNextIntegrationPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [health, setHealth] = useState<any>(null);
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
    apiClient.get<any>(`/api/v1/practices/${activePractice.id}/erpnext/health`, token)
      .then(setHealth)
      .catch(() => setHealth({ ok: false, provider: 'erpnext-healthcare-mock', isMock: true }));
  }, [activePractice]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;

  return (
    <>
      <Head><title>ERPNext Healthcare Integration — SynapseMed</title></Head>
      <Layout
        user={user}
        practices={practices}
        activePractice={activePractice}
        onPracticeChange={(p) => setActivePractice(p)}
        onLogout={() => { localStorage.clear(); router.push('/login'); }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-clinic-900 mb-2">ERPNext Healthcare Integration</h1>
          <p className="text-clinic-500">Connect SynapseMed with ERPNext Healthcare module for unified practice management</p>
          <div className="dev-banner mt-4">
            ⚠️ Development environment — using mock adapter by default. Configure ERPNEXT_URL and API credentials for live integration.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-clinic-900">Connection Status</h2>
              <Badge variant={health?.ok ? 'verified' : 'warning'}>{health?.ok ? 'Connected' : 'Mock Mode'}</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-clinic-100">
                <span className="text-sm text-clinic-600">Provider</span>
                <span className="text-sm font-medium text-clinic-900">{health?.provider || 'erpnext-healthcare-mock'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-clinic-100">
                <span className="text-sm text-clinic-600">Mode</span>
                <span className="text-sm font-medium text-clinic-900">{health?.isMock ? 'Mock (Development)' : 'Live'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-clinic-600">Version</span>
                <span className="text-sm font-medium text-clinic-900">{health?.version || 'mock-erpnext-healthcare'}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-clinic-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">Sync Patients</Button>
              <Button variant="outline" className="w-full justify-start">Sync Appointments</Button>
              <Button variant="outline" className="w-full justify-start">Create Encounter in ERPNext</Button>
              <Button variant="outline" className="w-full justify-start">Generate Invoice</Button>
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-clinic-900 mb-4">ERPNext Healthcare Module Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Patient Management', desc: 'Sync patient records with ERPNext Patient master' },
              { title: 'Appointments', desc: 'Book and manage appointments in ERPNext Healthcare' },
              { title: 'Clinical Encounters', desc: 'Create and sync clinical encounters/consultations' },
              { title: 'Billing & Invoicing', desc: 'Generate Sales Invoices through ERPNext' },
              { title: 'Practitioners', desc: 'Link SynapseMed users to ERPNext Healthcare Practitioners' },
              { title: 'Lab Tests', desc: 'Order and track lab tests via ERPNext Lab module' },
              { title: 'Prescriptions', desc: 'Manage prescriptions through ERPNext' },
              { title: 'Vital Signs', desc: 'Record vitals in ERPNext Vital Signs' },
            ].map((feature, idx) => (
              <div key={idx} className="p-4 border border-clinic-200 rounded-lg">
                <h3 className="font-medium text-clinic-900 mb-1">{feature.title}</h3>
                <p className="text-xs text-clinic-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </Layout>
    </>
  );
}
