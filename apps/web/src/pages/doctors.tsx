import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/apiClient';
import { Layout } from '@/components/layout/Layout';
import { Card, Button, Badge, Table, Avatar, Alert, Input } from '@/components/ui';

interface User { id: string; email: string; firstName: string; lastName: string; }
interface Practice { id: string; name: string; role: string; }
interface Membership {
  id: string;
  role: string;
  status: string;
  user: { id: string; email: string; firstName: string; lastName: string };
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Practice Owner',
  admin: 'Practice Admin',
  practitioner: 'Practitioner',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
};

export default function DoctorsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    apiClient.get<Membership[]>(`/api/v1/practices/${activePractice.id}/memberships`, token)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [activePractice]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;

  const practitioners = members.filter(m => m.role !== 'receptionist' && m.role !== 'admin' && m.role !== 'owner');
  const allStaff = members;

  const filtered = allStaff.filter(m =>
    `${m.user.firstName} ${m.user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    (m.user.email || '').includes(search)
  );

  return (
    <>
      <Head><title>Care Team — SynapseMed</title></Head>
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
              <h1 className="text-3xl font-bold text-clinic-900">Care Team</h1>
              <p className="text-clinic-500 text-sm">Practice doctors, nurses, and staff</p>
            </div>
            <Button variant="outline" disabled>Invite Team Member</Button>
          </div>
          <div className="dev-banner mt-4">
            ⚠️ Development environment — synthetic data only. Not for clinical use.
          </div>
        </div>

        <div className="mb-6">
          <Input
            label="Search team members"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Name, email, role…"
            className="max-w-md"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <Card padding="sm">
            <p className="text-xs font-semibold text-clinic-500 uppercase">Total Staff</p>
            <p className="text-2xl font-bold text-clinic-900">{allStaff.length}</p>
          </Card>
          <Card padding="sm">
            <p className="text-xs font-semibold text-clinic-500 uppercase">Practitioners</p>
            <p className="text-2xl font-bold text-clinic-900">{practitioners.length}</p>
          </Card>
          <Card padding="sm">
            <p className="text-xs font-semibold text-clinic-500 uppercase">Active</p>
            <p className="text-2xl font-bold text-synapse-600">{allStaff.filter(m => m.status === 'active').length}</p>
          </Card>
          <Card padding="sm">
            <p className="text-xs font-semibold text-clinic-500 uppercase">Invited</p>
            <p className="text-2xl font-bold text-amber-600">{allStaff.filter(m => m.status === 'invited').length}</p>
          </Card>
        </div>

        {/* Grid view (Preclinic doctor grid style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((m) => {
            const initials = `${m.user.firstName.charAt(0)}${m.user.lastName.charAt(0)}`;
            const roleLabel = ROLE_LABELS[m.role] || m.role;
            const isPractitioner = m.role === 'practitioner';
            return (
              <Card key={m.id} hover className="flex flex-col group cursor-pointer">
                <div className="relative h-48 overflow-hidden rounded-xl bg-clinic-50">
                  <Avatar size="lg" label={initials} className="absolute left-6 top-6 ring-2 ring-white bg-white" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-clinic-900 group-hover:text-synapse-600 transition-colors">{m.user.firstName} {m.user.lastName}</h3>
                    <Badge variant={m.status === 'active' ? 'verified' : 'warning'} className="text-[10px] px-2 py-1">{m.status.charAt(0).toUpperCase() + m.status.slice(1)}</Badge>
                  </div>
                  <p className="text-xs font-medium text-synapse-600 mb-3">{roleLabel}</p>
                  <p className="text-sm text-clinic-500 mb-4 flex-1">{m.user.email}</p>
                  <div className="mt-auto pt-4 border-t border-clinic-100 flex items-center justify-between">
                    <Link href={`/patients`} className="text-xs font-semibold text-clinic-700 hover:text-synapse-600 flex items-center gap-1">
                      Patients <span>→</span>
                    </Link>
                    <Button variant="ghost" size="sm">Message</Button>
                  </div>
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <p className="text-clinic-500 text-sm mb-2">No team members found.</p>
            </div>
          )}
        </div>
      </Layout>
      <Alert variant="info" title="Care team" className="mt-8 max-w-md">
        Practitioners have access to clinical notes, scheduling, and patient records based on their role and module entitlements.
      </Alert>
    </>
  );
}
