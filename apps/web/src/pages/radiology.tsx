import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/apiClient';
import { Layout } from '@/components/layout/Layout';
import { Card, Button, Input, Badge, Table } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';

interface User { id: string; email: string; firstName: string; lastName: string; }
interface Practice { id: string; name: string; role: string; }
interface Patient { id: string; firstName: string; lastName: string; }
interface RadiologyOrder { id: string; patientId: string; patient?: Patient; requestingUserId?: string; modality: string; bodyPart?: string; clinicalIndication?: string; urgency: string; status: string; externalStudyRef?: string; createdAt: string; }
interface RadiologyReport { id: string; orderId: string; radiologistName?: string; reportText: string; status: string; aiGenerated: boolean; reviewedBy?: string; signedAt?: string; }

const MODALITIES = ['X-Ray', 'CT', 'MRI', 'Ultrasound', 'Mammography', 'Fluoroscopy'];
const URGENCIES = ['routine', 'urgent', 'stat'];
const ORDER_STATUSES = ['ordered', 'in_progress', 'completed', 'cancelled'];

export default function RadiologyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [orders, setOrders] = useState<RadiologyOrder[]>([]);
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
      apiClient.get<RadiologyOrder[]>(`/api/v1/radiology/orders`, token),
    ])
      .then(([pts, ord]) => { setPatients(pts); setOrders(ord); })
      .catch(() => { setPatients([]); setOrders([]); });
  }, [activePractice]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;

  return (
    <>
      <Head><title>Radiology — SynapseMed</title></Head>
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
              <h1 className="text-3xl font-bold text-clinic-900">Radiology Orders</h1>
              <p className="text-clinic-500 text-sm">Imaging orders, modality worklist and report drafts</p>
            </div>
            <Button variant="primary" onClick={() => {}}>+ New Order</Button>
          </div>
          <div className="dev-banner mt-4">
            ⚠️ Development environment — synthetic data only. Not for clinical use. Radiology module.
          </div>
        </div>

        {/* Modality Worklist */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-clinic-900">Modality Worklist</h2>
              <p className="text-clinic-500 text-sm">Orders by modality and urgency</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODALITIES.map(mod => {
              const modOrders = orders.filter(o => o.modality === mod);
              const urgent = modOrders.filter(o => o.urgency !== 'routine').length;
              return (
                <Card key={mod} className="cursor-pointer hover:shadow-card-hover transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-clinic-500 uppercase">{mod}</span>
                      <p className="text-2xl font-bold text-clinic-900">{modOrders.length}</p>
                      {urgent > 0 && <span className="text-xs bg-red-50 text-red-600 border border-red-100 rounded-full px-2 py-0.5 mt-1 inline-block">{urgent} urgent</span>}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-clinic-100 flex items-center justify-center text-clinic-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>

        {/* Orders Table */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-clinic-900">Orders</h2>
            <div className="flex gap-2">
              <select className="border border-clinic-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500">
                <option>All statuses</option>
                {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="border border-clinic-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500">
                <option>All modalities</option>
                {MODALITIES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <Table
            columns={['Patient', 'Modality', 'Body Part', 'Urgency', 'Status', 'Created', 'Actions']}
            data={orders}
            renderCell={(row, col) => {
              if (col === 'Patient') {
                const p = patients.find(pt => pt.id === row.patientId);
                return <span className="font-medium text-clinic-900">{p ? `${p.firstName} ${p.lastName}` : 'Unknown'}</span>;
              }
              if (col === 'Modality') return <span className="text-clinic-600">{row.modality}</span>;
              if (col === 'Body Part') return <span className="text-clinic-600">{row.bodyPart || '—'}</span>;
              if (col === 'Urgency') return <Badge variant={row.urgency === 'stat' ? 'danger' : row.urgency === 'urgent' ? 'warning' : 'default'}>{row.urgency.toUpperCase()}</Badge>;
              if (col === 'Status') return <Badge variant="default">{row.status}</Badge>;
              if (col === 'Created') return <span className="text-clinic-600 text-sm">{new Date(row.createdAt).toLocaleDateString()}</span>;
              if (col === 'Actions') {
                return <div className="flex gap-2"><Button variant="ghost" size="sm">View</Button><Button variant="outline" size="sm">Report</Button></div>;
              }
              return String(row[col]);
            }}
            emptyMessage="No radiology orders."
          />
        </Card>
      </Layout>
    </>
  );
}
