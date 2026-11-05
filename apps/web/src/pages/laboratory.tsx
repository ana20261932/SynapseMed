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
interface LabOrder { id: string; patientId: string; patient?: Patient; requestingUserId?: string; testType: string; specimenType?: string; clinicalIndication?: string; urgency: string; status: string; result?: string; reviewedBy?: string; signedAt?: string; createdAt: string; }

const TEST_TYPES = ['Blood Count', 'Chemistry Panel', 'Lipid Panel', 'Glucose', 'HbA1c', 'Liver Function', 'Kidney Function', 'Thyroid', 'Urine Analysis', 'Culture'];
const URGENCIES = ['routine', 'urgent', 'stat'];
const ORDER_STATUSES = ['ordered', 'specimen_collected', 'in_progress', 'completed', 'cancelled'];

export default function LaboratoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

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
      apiClient.get<LabOrder[]>(`/api/v1/laboratory/orders`, token),
    ])
      .then(([pts, ord]) => { setPatients(pts); setOrders(ord); })
      .catch(() => { setPatients([]); setOrders([]); });
  }, [activePractice]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;

  return (
    <>
      <Head><title>Laboratory — SynapseMed</title></Head>
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
              <h1 className="text-3xl font-bold text-clinic-900">Laboratory Orders</h1>
              <p className="text-clinic-500 text-sm">Lab orders, specimen tracking and results</p>
            </div>
            <Button variant="primary" onClick={() => setAddOpen(true)}>+ New Order</Button>
          </div>
          <div className="dev-banner mt-4">
            ⚠️ Development environment — synthetic data only. Not for clinical use. Laboratory module.
          </div>
        </div>

        <Table
          columns={['Patient', 'Test Type', 'Specimen', 'Urgency', 'Status', 'Result', 'Created', 'Actions']}
          data={orders}
          renderCell={(row, col) => {
            if (col === 'Patient') {
              const p = patients.find(pt => pt.id === row.patientId);
              return <span className="font-medium text-clinic-900">{p ? `${p.firstName} ${p.lastName}` : 'Unknown'}</span>;
            }
            if (col === 'Test Type') return <span className="text-clinic-600 text-sm">{row.testType}</span>;
            if (col === 'Specimen') return <span className="text-clinic-600 text-sm">{row.specimenType || '—'}</span>;
            if (col === 'Urgency') return <Badge variant={row.urgency === 'stat' ? 'danger' : row.urgency === 'urgent' ? 'warning' : 'default'}>{row.urgency.toUpperCase()}</Badge>;
            if (col === 'Status') return <Badge variant="default">{row.status.replace(/_/g, ' ').toUpperCase()}</Badge>;
            if (col === 'Result') return <span className="text-clinic-600 text-sm">{row.result || 'Pending'}</span>;
            if (col === 'Created') return <span className="text-clinic-600 text-sm">{new Date(row.createdAt).toLocaleDateString()}</span>;
            if (col === 'Actions') return <div className="flex gap-2"><Button variant="ghost" size="sm">View</Button><Button variant="outline" size="sm">Result</Button></div>;
            return String(row[col]);
          }}
          emptyMessage="No laboratory orders."
        />

        <Modal
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          title="New Laboratory Order"
          size="lg"
        >
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setAddOpen(false); }}>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Patient" required />
              <select value="" className="w-full border border-clinic-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500">
                <option>Test Type</option>
                {TEST_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <Input label="Specimen Type" placeholder="e.g. Blood, Urine" />
              <select value="" className="w-full border border-clinic-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500">
                <option>Urgency</option>
                {URGENCIES.map(u => <option key={u}>{u}</option>)}
              </select>
              <select value="" className="w-full border border-clinic-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500">
                <option>Status</option>
                {ORDER_STATUSES.map(s => <option key={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <Input label="Clinical Indication" as="textarea" rows={2} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-clinic-100">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Create Order</Button>
            </div>
          </form>
        </Modal>
      </Layout>
    </>
  );
}
