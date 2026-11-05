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
interface Appointment { id: string; patientId: string; patient?: Patient; practitionerUserId?: string; appointmentType?: string; location?: string; startsAt: string; endsAt: string; status: string; notes?: string; }

const STATUS_COLORS: Record<string, string> = {
  booked: 'bg-blue-50 text-blue-700 border-blue-100',
  checked_in: 'bg-synapse-50 text-synapse-700 border-synapse-100',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-100',
  completed: 'bg-green-50 text-green-700 border-green-100',
  cancelled: 'bg-red-50 text-red-700 border-red-100',
  no_show: 'bg-clinic-100 text-clinic-600 border-clinic-200',
};

interface ApptForm { patientId: string; appointmentType: string; date: string; time: string; durationMin: string; location: string; notes: string; }

export default function AppointmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [apptForm, setApptForm] = useState<ApptForm>({ patientId: '', appointmentType: '', date: '', time: '', durationMin: '30', location: '', notes: '' });
  const [apptError, setApptError] = useState('');
  const [apptAdding, setApptAdding] = useState(false);

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
      apiClient.get<Appointment[]>(`/api/v1/practices/${activePractice.id}/appointments`, token),
    ])
      .then(([pts, appts]) => { setPatients(pts); setAppointments(appts); })
      .catch(() => { setPatients([]); setAppointments([]); });
  }, [activePractice]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;

  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.startsAt.startsWith(today));

  return (
    <>
      <Head><title>Appointments — SynapseMed</title></Head>
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
              <h1 className="text-3xl font-bold text-clinic-900">Appointments</h1>
              <p className="text-clinic-500 text-sm">Schedule and manage patient appointments</p>
            </div>
            <div className="flex gap-3">
              <Button variant={view === 'list' ? 'secondary' : 'outline'} size="sm" onClick={() => setView('list')}>List</Button>
              <Button variant={view === 'calendar' ? 'secondary' : 'outline'} size="sm" onClick={() => setView('calendar')}>Calendar</Button>
              <Button variant="primary" onClick={() => setAddOpen(true)}>+ New Appointment</Button>
            </div>
          </div>
          <div className="dev-banner mt-4">
            ⚠️ Development environment — synthetic data only. Not for clinical use.
          </div>
        </div>

        {/* Today's summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-clinic-500 uppercase">Today's Appointments</p>
                <p className="text-2xl font-bold text-clinic-900">{todayAppts.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-clinic-500 uppercase">Upcoming</p>
                <p className="text-2xl font-bold text-clinic-900">{appointments.filter(a => a.status === 'booked').length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-synapse-50 flex items-center justify-center text-synapse-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-clinic-500 uppercase">Completed Today</p>
                <p className="text-2xl font-bold text-clinic-900">{todayAppts.filter(a => a.status === 'completed').length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {view === 'list' ? (
          <Table
            columns={['Patient', 'Type', 'Date & Time', 'Location', 'Practitioner', 'Status', 'Actions']}
            data={appointments}
            renderCell={(row, col) => {
              if (col === 'Patient') {
                const p = patients.find(pt => pt.id === row.patientId);
                return <span className="font-medium text-clinic-900">{p ? `${p.firstName} ${p.lastName}` : 'Unknown Patient'}</span>;
              }
              if (col === 'Type') return <span className="text-clinic-600 capitalize">{row.appointmentType || 'General'}</span>;
              if (col === 'Date & Time') return (
                <span className="text-clinic-600 text-sm">
                  {new Date(row.startsAt).toLocaleDateString()} <br />
                  {new Date(row.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              );
              if (col === 'Location') return <span className="text-clinic-600">{row.location || '—'}</span>;
              if (col === 'Practitioner') return <span className="text-clinic-600">{row.practitionerUserId ? 'Dr. Provider' : 'Unassigned'}</span>;
              if (col === 'Status') return <Badge variant={STATUS_COLORS[row.status] ? 'default' : 'info'} className={STATUS_COLORS[row.status] || ''}>{row.status.replace(/_/g, ' ').toUpperCase()}</Badge>;
              if (col === 'Actions') {
                return (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">Details</Button>
                  </div>
                );
              }
              return String(row[col]);
            }}
            emptyMessage="No appointments scheduled."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 min-h-[600px]">
            <div className="border border-clinic-200 rounded-xl bg-white p-3">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-clinic-600">Time</span>
                <div className="w-8 h-8 rounded-full bg-clinic-100 flex items-center justify-center text-clinic-400 text-xs">←</div>
              </div>
              {[9, 10, 11, 12, 13, 14, 15, 16, 17].map(h => (
                <div key={h} className="text-[10px] text-clinic-400 mb-2">{h}:00</div>
              ))}
            </div>
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <div key={day} className="border border-clinic-200 rounded-xl bg-white p-3 min-h-[400px]">
                <div className="text-xs font-semibold text-clinic-600 mb-3 text-center">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][day-1]}</div>
                <div className="space-y-1">
                  {todayAppts.slice(0, 3).map(a => (
                    <div key={a.id} className="bg-synapse-50 text-synapse-700 text-xs rounded-lg px-2 py-1 border border-synapse-100 truncate">
                      {patients.find(p => p.id === a.patientId)?.firstName}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={addOpen}
          onClose={() => { if (!apptAdding) { setAddOpen(false); setApptError(''); } }}
          title="Schedule New Appointment"
          size="lg"
        >
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            if (!activePractice) return;
            const token = localStorage.getItem('accessToken');
            if (!token) return;
            setApptAdding(true); setApptError('');
            try {
              const startsAt = new Date(`${apptForm.date}T${apptForm.time}`).toISOString();
              const endsAt = new Date(new Date(`${apptForm.date}T${apptForm.time}`).getTime() + parseInt(apptForm.durationMin || '30') * 60000).toISOString();
              const created = await apiClient.post<Appointment>(`/api/v1/practices/${activePractice.id}/appointments`, {
                patientId: apptForm.patientId,
                appointmentType: apptForm.appointmentType || undefined,
                startsAt,
                endsAt,
                location: apptForm.location || undefined,
                notes: apptForm.notes || undefined,
              }, token);
              setAppointments(prev => [created, ...prev]);
              setAddOpen(false);
              setApptForm({ patientId: '', appointmentType: '', date: '', time: '', durationMin: '30', location: '', notes: '' });
            } catch (err: unknown) {
              setApptError(err instanceof Error ? err.message : 'Failed to schedule appointment');
            } finally {
              setApptAdding(false);
            }
          }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-clinic-700 mb-1">Patient <span className="text-red-500">*</span></label>
                <select value={apptForm.patientId} onChange={e => setApptForm(p => ({ ...p, patientId: e.target.value }))} required className="w-full border border-clinic-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500">
                  <option value="">Select patient…</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <Input label="Appointment Type" value={apptForm.appointmentType} onChange={e => setApptForm(p => ({ ...p, appointmentType: e.target.value }))} required />
              <Input label="Date" type="date" value={apptForm.date} onChange={e => setApptForm(p => ({ ...p, date: e.target.value }))} required />
              <Input label="Time" type="time" value={apptForm.time} onChange={e => setApptForm(p => ({ ...p, time: e.target.value }))} required />
              <Input label="Duration (min)" type="number" value={apptForm.durationMin} onChange={e => setApptForm(p => ({ ...p, durationMin: e.target.value }))} />
              <Input label="Location" value={apptForm.location} onChange={e => setApptForm(p => ({ ...p, location: e.target.value }))} />
            </div>
            <Input label="Notes" as="textarea" rows={3} value={apptForm.notes} onChange={e => setApptForm(p => ({ ...p, notes: e.target.value }))} />
            {apptError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{apptError}</div>}
            <div className="flex justify-end gap-3 pt-4 border-t border-clinic-100">
              <Button variant="outline" onClick={() => { setAddOpen(false); setApptError(''); }} disabled={apptAdding}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={apptAdding}>{apptAdding ? 'Scheduling…' : 'Schedule Appointment'}</Button>
            </div>
          </form>
        </Modal>
      </Layout>
    </>
  );
}
