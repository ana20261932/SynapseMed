import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { Layout } from '@/components/layout/Layout';
import { Card, Button, Badge, Table, Avatar, Alert } from '@/components/ui';

interface User { id: string; email: string; firstName: string; lastName: string; }
interface Practice { id: string; name: string; role: string; }
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  medicalAidScheme?: string;
  medicalAidNumber?: string;
  status: string;
  consents?: Array<{ type: string; granted: boolean; grantedAt?: string }>;
}
interface Appointment {
  id: string;
  patientId: string;
  appointmentType?: string;
  location?: string;
  startsAt: string;
  endsAt: string;
  status: string;
  notes?: string;
}

const STATUS_COLORS: Record<string, string> = {
  booked: 'bg-blue-50 text-blue-700 border-blue-100',
  checked_in: 'bg-synapse-50 text-synapse-700 border-synapse-100',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-100',
  completed: 'bg-green-50 text-green-700 border-green-100',
  cancelled: 'bg-red-50 text-red-700 border-red-100',
  no_show: 'bg-clinic-100 text-clinic-600 border-clinic-200',
};

export default function PatientDetailsPage() {
  const router = useRouter();
  const patientId = String(router.query.id);
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    let cancelled = false;
    Promise.all([
      apiClient.get<Patient>(`/api/v1/practices/${activePractice.id}/patients/${patientId}`, token),
      apiClient.get<Appointment[]>(`/api/v1/practices/${activePractice.id}/appointments`, token),
    ])
      .then(([pt, appts]) => {
        if (cancelled) return;
        setPatient(pt);
        setAppointments(appts.filter(a => a.patientId === patientId));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load patient');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activePractice, patientId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <Alert variant="error" title="Unable to load patient">{error}</Alert>
    </div>
  );
  if (!patient) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Patient not found.</div>;

  const initials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`;

  const handleStatusChange = (id: string, status: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    apiClient.patch(`/api/v1/practices/${activePractice!.id}/appointments/${id}/status`, { status }, token)
      .then(() => {
        setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
      });
  };

  return (
    <>
      <Head><title>Patient Details — SynapseMed</title></Head>
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
              <Link href="/patients" className="text-clinic-500 text-sm hover:underline mb-2 block">← Back to patients</Link>
              <h1 className="text-3xl font-bold text-clinic-900">{patient.firstName} {patient.lastName}</h1>
              <p className="text-clinic-500 text-sm">{patient.email || patient.phone || 'No contact on file'}</p>
            </div>
            <div className="flex gap-3">
              <Badge variant={patient.status === 'active' ? 'verified' : 'default'} className="text-[12px] px-3 py-1.5">
                {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
              </Badge>
              <Button variant="outline" size="sm">Edit Profile</Button>
            </div>
          </div>
          <div className="dev-banner mt-4">
            ⚠️ Development environment — synthetic data only. Not for clinical use.
          </div>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-clinic-500 uppercase">Date of Birth</p>
                <p className="text-lg font-bold text-clinic-900">{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '—'}</p>
              </div>
              <Avatar size="xl" label={initials} />
            </div>
          </Card>
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-clinic-500 uppercase">Gender</p>
                <p className="text-lg font-bold text-clinic-900 capitalize">{patient.gender || '—'}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-clinic-100 flex items-center justify-center text-clinic-500 text-sm">👤</div>
            </div>
          </Card>
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-clinic-500 uppercase">Medical Aid Number</p>
                <p className="text-lg font-bold text-clinic-900">{patient.medicalAidNumber || '—'}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-synapse-50 flex items-center justify-center text-synapse-600 text-sm">🪪</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact & info card */}
          <Card className="lg:col-span-1">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-clinic-900 mb-3">Contact Information</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-clinic-100 flex items-center justify-center text-clinic-500 text-xs">✉️</div>
                  <div>
                    <p className="text-sm text-clinic-900 font-medium">Email</p>
                    <p className="text-sm text-clinic-500">{patient.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-clinic-100 flex items-center justify-center text-clinic-500 text-xs">📞</div>
                  <div>
                    <p className="text-sm text-clinic-900 font-medium">Phone</p>
                    <p className="text-sm text-clinic-500">{patient.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-clinic-100 flex items-center justify-center text-clinic-500 text-xs">📍</div>
                  <div>
                    <p className="text-sm text-clinic-900 font-medium">Address</p>
                    <p className="text-sm text-clinic-500">{patient.address || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-clinic-100 flex items-center justify-center text-clinic-500 text-xs">#</div>
                  <div>
                    <p className="text-sm text-clinic-900 font-medium">ID / Passport Number</p>
                    <p className="text-sm text-clinic-500">{patient.idNumber || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Appointments card */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-clinic-900">Appointment History</h2>
              <Badge variant="default" className="text-[11px] px-2 py-1">{appointments.length} total</Badge>
            </div>
            <Table
              columns={['Date', 'Type', 'Location', 'Status', 'Actions']}
              data={appointments.sort((a, b) => b.startsAt.localeCompare(a.startsAt))}
              renderCell={(row, col) => {
                if (col === 'Date') return (
                  <span className="text-clinic-600 text-sm">{new Date(row.startsAt).toLocaleDateString()} <br /> <span className="text-xs text-clinic-500">{new Date(row.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span>
                );
                if (col === 'Type') return <span className="text-clinic-600 capitalize">{row.appointmentType || 'General'}</span>;
                if (col === 'Location') return <span className="text-clinic-600">{row.location || '—'}</span>;
                if (col === 'Status') return <Badge variant="default" className={STATUS_COLORS[row.status] || ''}>{row.status.replace(/_/g, ' ').toUpperCase()}</Badge>;
                if (col === 'Actions') {
                  return (
                    <div className="flex gap-2">
                      {row.status === 'booked' && (
                        <Button variant="danger" size="sm" onClick={() => handleStatusChange(row.id, 'cancelled')}>Cancel</Button>
                      )}
                      {row.status === 'booked' && (
                        <Button variant="outline" size="sm" onClick={() => handleStatusChange(row.id, 'checked_in')}>Check In</Button>
                      )}
                      <Button variant="ghost" size="sm">Details</Button>
                    </div>
                  );
                }
                return String(row[col]);
              }}
              emptyMessage="No appointments on record."
            />
          </Card>
        </div>

        {/* Consents card */}
        {(patient.consents && patient.consents.length > 0) && (
          <Card className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-clinic-900">Consents</h2>
              <p className="text-clinic-500 text-sm">Patient consent records</p>
            </div>
            <Table
              columns={['Type', 'Granted', 'Date']}
              data={patient.consents}
              renderCell={(row, col) => {
                if (col === 'Type') return <span className="text-clinic-900 capitalize">{row.type.replace(/_/g, ' ')}</span>;
                if (col === 'Granted') return <Badge variant={row.granted ? 'verified' : 'warning'}>{row.granted ? 'Yes' : 'No'}</Badge>;
                if (col === 'Date') return <span className="text-clinic-600 text-sm">{row.grantedAt ? new Date(row.grantedAt).toLocaleDateString() : '—'}</span>;
                return String(row[col]);
              }}
              emptyMessage="No consents recorded."
            />
          </Card>
        )}
      </Layout>
    </>
  );
}
