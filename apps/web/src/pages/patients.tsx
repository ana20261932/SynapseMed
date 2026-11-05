import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/apiClient';
import { Layout } from '@/components/layout/Layout';
import { Card, Button, Input, Badge, Table } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';

interface User { id: string; email: string; firstName: string; lastName: string; }
interface Practice { id: string; name: string; role: string; }
interface Patient { id: string; firstName: string; lastName: string; dateOfBirth?: string; gender?: string; idNumber?: string; phone?: string; email?: string; medicalAidScheme?: string; medicalAidNumber?: string; status: string; }

interface PatientForm { firstName: string; lastName: string; dateOfBirth: string; gender: string; idNumber: string; phone: string; email: string; medicalAidScheme: string; }

export default function PatientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [addForm, setAddForm] = useState<PatientForm>({ firstName: '', lastName: '', dateOfBirth: '', gender: '', idNumber: '', phone: '', email: '', medicalAidScheme: '' });
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

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

  const filtered = patients.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || '').includes(search) ||
    (p.email || '').includes(search)
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;

  return (
    <>
      <Head><title>Patients — SynapseMed</title></Head>
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
              <h1 className="text-3xl font-bold text-clinic-900">Patients</h1>
              <p className="text-clinic-500 text-sm">Manage patient demographics and records</p>
            </div>
            <Button variant="primary" onClick={() => setAddOpen(true)}>+ Add Patient</Button>
          </div>
          <div className="dev-banner mt-4">
            ⚠️ Development environment — synthetic data only. Not for clinical use.
          </div>
        </div>

        <div className="mb-6">
          <Input
            label="Search patients"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Name, phone, email, ID number…"
            className="max-w-md"
          />
        </div>

        <Table
          columns={['Name', 'DOB', 'Gender', 'ID Number', 'Phone', 'Medical Aid', 'Status']}
          data={filtered}
          renderCell={(row, col) => {
            if (col === 'Name') return (
              <div>
                <Link href={`/patients/${row.id}`} className="font-medium text-clinic-900 hover:underline">{row.firstName} {row.lastName}</Link>
              </div>
            );
            if (col === 'DOB') return <span className="text-clinic-600">{row.dateOfBirth ? new Date(row.dateOfBirth as string).toLocaleDateString() : '-'}</span>;
            if (col === 'Gender') return <span className="text-clinic-600 capitalize">{row.gender || '-'}</span>;
            if (col === 'ID Number') return <span className="text-clinic-600">{row.idNumber || '-'}</span>;
            if (col === 'Phone') return <span className="text-clinic-600">{row.phone || '-'}</span>;
            if (col === 'Medical Aid') return <span className="text-clinic-600">{row.medicalAidNumber || '-'}</span>;
            if (col === 'Status') return <Badge variant={row.status === 'active' ? 'verified' : 'default'}>{row.status}</Badge>;
            return String(row[col]);
          }}
          emptyMessage="No patients found."
        />
      </Layout>

      <Modal
        isOpen={addOpen}
        onClose={() => { if (!adding) { setAddOpen(false); setAddError(''); } }}
        title="Add New Patient"
        size="lg"
      >
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          if (!activePractice) return;
          const token = localStorage.getItem('accessToken');
          if (!token) return;
          setAdding(true); setAddError('');
          try {
            const created = await apiClient.post<Patient>(`/api/v1/practices/${activePractice.id}/patients`, {
              firstName: addForm.firstName,
              lastName: addForm.lastName,
              dateOfBirth: addForm.dateOfBirth || undefined,
              gender: addForm.gender || undefined,
              idNumber: addForm.idNumber || undefined,
              phone: addForm.phone || undefined,
              email: addForm.email || undefined,
              medicalAidScheme: addForm.medicalAidScheme || undefined,
            }, token);
            setPatients(prev => [created, ...prev]);
            setAddOpen(false);
            setAddForm({ firstName: '', lastName: '', dateOfBirth: '', gender: '', idNumber: '', phone: '', email: '', medicalAidScheme: '' });
          } catch (err: unknown) {
            setAddError(err instanceof Error ? err.message : 'Failed to add patient');
          } finally {
            setAdding(false);
          }
        }}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={addForm.firstName} onChange={e => setAddForm(p => ({ ...p, firstName: e.target.value }))} required />
            <Input label="Last Name" value={addForm.lastName} onChange={e => setAddForm(p => ({ ...p, lastName: e.target.value }))} required />
            <Input label="Date of Birth" type="date" value={addForm.dateOfBirth} onChange={e => setAddForm(p => ({ ...p, dateOfBirth: e.target.value }))} />
            <Input label="Gender" value={addForm.gender} onChange={e => setAddForm(p => ({ ...p, gender: e.target.value }))} />
            <Input label="ID / Passport Number" value={addForm.idNumber} onChange={e => setAddForm(p => ({ ...p, idNumber: e.target.value }))} />
            <Input label="Phone" type="tel" value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} />
            <Input label="Email" type="email" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} />
            <Input label="Medical Aid Scheme" value={addForm.medicalAidScheme} onChange={e => setAddForm(p => ({ ...p, medicalAidScheme: e.target.value }))} />
          </div>
          {addError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{addError}</div>}
          <div className="flex justify-end gap-3 pt-4 border-t border-clinic-100">
            <Button variant="outline" onClick={() => { setAddOpen(false); setAddError(''); }} disabled={adding}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={adding}>{adding ? 'Saving…' : 'Save Patient'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
