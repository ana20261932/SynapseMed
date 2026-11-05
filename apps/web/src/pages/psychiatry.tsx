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
interface MentalHealthRecord { id: string; patientId: string; patient?: Patient; authorUserId?: string; recordType: string; content: string; status: string; accessRestricted: boolean; consentRef?: string; aiGenerated: boolean; reviewedBy?: string; signedAt?: string; createdAt: string; }

const RECORD_TYPES = ['initial_assessment', 'progress_note', 'treatment_plan', 'discharge_summary', 'crisis_note'];
const RECORD_STATUSES = ['draft', 'reviewed', 'signed'];

export default function PsychiatryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<MentalHealthRecord[]>([]);
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
      apiClient.get<MentalHealthRecord[]>(`/api/v1/psychiatry/records`, token),
    ])
      .then(([pts, rec]) => { setPatients(pts); setRecords(rec); })
      .catch(() => { setPatients([]); setRecords([]); });
  }, [activePractice]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;

  return (
    <>
      <Head><title>Psychiatry — SynapseMed</title></Head>
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
              <h1 className="text-3xl font-bold text-clinic-900">Mental Health Records</h1>
              <p className="text-clinic-500 text-sm">Restricted-access psychiatric notes with enhanced privacy controls</p>
            </div>
            <Button variant="primary" onClick={() => setAddOpen(true)}>+ New Record</Button>
          </div>
          <div className="dev-banner mt-4">
            ⚠️ Development environment — synthetic data only. Not for clinical use. Psychiatry module. Enhanced access controls apply.
          </div>
        </div>

        {/* Privacy notice */}
        <Card className="mb-8 bg-red-50 border border-red-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Confidential — Restricted Access</h3>
              <p className="text-sm text-red-700">Mental health records are access-restricted. Only authorised clinicians with appropriate permissions may view or edit these records. All content requires clinician review and signature.</p>
            </div>
          </div>
        </Card>

        <Table
          columns={['Patient', 'Record Type', 'Status', 'AI Generated', 'Reviewed', 'Created', 'Actions']}
          data={records}
          renderCell={(row, col) => {
            if (col === 'Patient') {
              const p = patients.find(pt => pt.id === row.patientId);
              return <span className="font-medium text-clinic-900">{p ? `${p.firstName} ${p.lastName}` : 'Unknown'}</span>;
            }
            if (col === 'Record Type') return <span className="text-clinic-600 text-sm capitalize">{row.recordType.replace(/_/g, ' ')}</span>;
            if (col === 'Status') return <Badge variant={row.status === 'signed' ? 'verified' : row.status === 'draft' ? 'draft' : 'info'}>{row.status.toUpperCase()}</Badge>;
            if (col === 'AI Generated') return <Badge variant={row.aiGenerated ? 'warning' : 'verified'}>{row.aiGenerated ? 'YES' : 'NO'}</Badge>;
            if (col === 'Reviewed') return <span className="text-clinic-600 text-sm">{row.reviewedBy ? 'Yes' : 'Pending'}</span>;
            if (col === 'Created') return <span className="text-clinic-600 text-sm">{new Date(row.createdAt).toLocaleDateString()}</span>;
            if (col === 'Actions') return <div className="flex gap-2"><Button variant="ghost" size="sm">View</Button><Button variant="outline" size="sm">Review</Button></div>;
            return String(row[col]);
          }}
          emptyMessage="No mental health records."
        />

        <Modal
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          title="New Mental Health Record"
          size="lg"
        >
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setAddOpen(false); }}>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Patient" required />
              <select value="" className="w-full border border-clinic-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500">
                <option>Record Type</option>
                {RECORD_TYPES.map(t => <option key={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
              <select value="" className="w-full border border-clinic-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500">
                <option>Status</option>
                {RECORD_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <Input label="Consent Reference" placeholder="Optional consent ref" />
            </div>
            <Input label="Clinical Content" as="textarea" rows={6} required />
            <div className="flex items-center gap-2 mb-4">
              <input type="checkbox" id="aiDraft" className="w-4 h-4 text-synapse-600 border-clinic-300 rounded focus:ring-synapse-500" />
              <label htmlFor="aiDraft" className="text-sm text-clinic-600">AI-generated draft (requires clinician review)</label>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-amber-800">AI-generated clinical content is flagged for human clinician review before signing.</p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-clinic-100">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Save Record</Button>
            </div>
          </form>
        </Modal>
      </Layout>
    </>
  );
}
