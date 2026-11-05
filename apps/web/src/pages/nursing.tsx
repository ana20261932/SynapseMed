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
interface NursingSession { id: string; patientId: string; patient?: Patient; practitionerUserId?: string; discipline: string; sessionType: string; sessionDate: string; durationMinutes?: number; goals?: string; outcomeNotes: string; status: string; signedAt?: string; createdAt: string; }

const DISCIPLINES = ['Nursing', 'Physiotherapy', 'Occupational Therapy', 'Speech Therapy', 'Dietetics'];
const SESSION_TYPES = ['Initial Assessment', 'Follow-up', 'Vital Signs', 'Wound Care', 'Medication Admin', 'Rehabilitation'];

export default function NursingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<NursingSession[]>([]);
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
      apiClient.get<NursingSession[]>(`/api/v1/nursing/sessions`, token),
    ])
      .then(([pts, sess]) => { setPatients(pts); setSessions(sess); })
      .catch(() => { setPatients([]); setSessions([]); });
  }, [activePractice]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;

  return (
    <>
      <Head><title>Nursing & Allied Health — SynapseMed</title></Head>
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
              <h1 className="text-3xl font-bold text-clinic-900">Nursing & Allied Health</h1>
              <p className="text-clinic-500 text-sm">Observations, care plans and session documentation</p>
            </div>
            <Button variant="primary" onClick={() => setAddOpen(true)}>+ New Session</Button>
          </div>
          <div className="dev-banner mt-4">
            ⚠️ Development environment — synthetic data only. Not for clinical use. Nursing/Allied Health module.
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <p className="text-xs font-semibold text-clinic-500 uppercase">Total Sessions</p>
            <p className="text-2xl font-bold text-clinic-900">{sessions.length}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold text-clinic-500 uppercase">Draft Sessions</p>
            <p className="text-2xl font-bold text-clinic-900">{sessions.filter(s => s.status === 'draft').length}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold text-clinic-500 uppercase">Signed Today</p>
            <p className="text-2xl font-bold text-clinic-900">{sessions.filter(s => s.status === 'signed').length}</p>
          </Card>
        </div>

        <Table
          columns={['Patient', 'Discipline', 'Session Type', 'Date', 'Duration', 'Status', 'Signed', 'Actions']}
          data={sessions}
          renderCell={(row, col) => {
            if (col === 'Patient') {
              const p = patients.find(pt => pt.id === row.patientId);
              return <span className="font-medium text-clinic-900">{p ? `${p.firstName} ${p.lastName}` : 'Unknown'}</span>;
            }
            if (col === 'Discipline') return <span className="text-clinic-600 text-sm">{row.discipline}</span>;
            if (col === 'Session Type') return <span className="text-clinic-600 text-sm">{row.sessionType}</span>;
            if (col === 'Date') return <span className="text-clinic-600 text-sm">{new Date(row.sessionDate).toLocaleDateString()}</span>;
            if (col === 'Duration') return <span className="text-clinic-600 text-sm">{row.durationMinutes ? `${row.durationMinutes} min` : '—'}</span>;
            if (col === 'Status') return <Badge variant={row.status === 'signed' ? 'verified' : 'draft'}>{row.status.toUpperCase()}</Badge>;
            if (col === 'Signed') return <span className="text-clinic-600 text-sm">{row.signedAt ? 'Yes' : '—'}</span>;
            if (col === 'Actions') return <div className="flex gap-2"><Button variant="ghost" size="sm">View</Button><Button variant="outline" size="sm">Edit</Button></div>;
            return String(row[col]);
          }}
          emptyMessage="No sessions recorded."
        />

        <Modal
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          title="New Session Note"
          size="lg"
        >
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setAddOpen(false); }}>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Patient" required />
              <select value="" className="w-full border border-clinic-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500">
                <option>Discipline</option>
                {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
              </select>
              <select value="" className="w-full border border-clinic-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500">
                <option>Session Type</option>
                {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <Input label="Session Date" type="date" required />
              <Input label="Duration (min)" type="number" />
            </div>
            <Input label="Goals" as="textarea" rows={3} />
            <Input label="Outcome Notes" as="textarea" rows={4} required />
            <div className="flex justify-end gap-3 pt-4 border-t border-clinic-100">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Save Session</Button>
            </div>
          </form>
        </Modal>
      </Layout>
    </>
  );
}
