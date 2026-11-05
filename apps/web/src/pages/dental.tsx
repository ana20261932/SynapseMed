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
interface OdontogramChart { id: string; patientId: string; patient?: Patient; chartDate: string; authorUserId?: string; notes?: string; }
interface ToothEntry { id: string; chartId: string; toothNumber: number; surface?: string; condition: string; notes?: string; }
interface TreatmentPlan { id: string; chartId: string; patientId?: string; authorUserId?: string; status: string; notes?: string; items?: Array<{ toothNumber?: number; procedureCode: string; description: string; estimatedFeeZar: number; status: string; }>; }

const TOOTH_NUMBERS = Array.from({ length: 32 }, (_, i) => i + 1);
const TOOTH_CONDITIONS = ['healthy', 'caries', 'filling', 'crown', 'missing', 'impacted', 'root_canal', 'implant'];

export default function DentalPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [charts, setCharts] = useState<OdontogramChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState<OdontogramChart | null>(null);

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
      apiClient.get<OdontogramChart[]>(`/api/v1/dental/charts`, token),
    ])
      .then(([pts, ch]) => { setPatients(pts); setCharts(ch); })
      .catch(() => { setPatients([]); setCharts([]); });
  }, [activePractice]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;

  return (
    <>
      <Head><title>Dental Odontogram — SynapseMed</title></Head>
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
              <h1 className="text-3xl font-bold text-clinic-900">Dental Odontogram</h1>
              <p className="text-clinic-500 text-sm">Tooth chart, procedures and treatment plans</p>
            </div>
            <Button variant="primary" onClick={() => { if (patients.length > 0) setSelectedChart(null); }}>
              + New Chart
            </Button>
          </div>
          <div className="dev-banner mt-4">
            ⚠️ Development environment — synthetic data only. Not for clinical use. Dentistry module.
          </div>
        </div>

        {/* Patient selector */}
        <Card className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-clinic-900">Select Patient</h2>
              <p className="text-clinic-500 text-sm">Choose a patient to view/create their odontogram chart</p>
            </div>
          </div>
          <div className="overflow-x-auto px-4 mt-4">
            <div className="flex gap-4 min-w-max">
              {patients.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    const existing = charts.find(c => c.patientId === p.id);
                    setSelectedChart(existing ?? null);
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border min-w-[140px] transition-colors ${selectedChart?.patientId === p.id ? 'bg-synapse-50 border-synapse-200' : 'border-clinic-200 hover:border-synapse-400'}`}
                >
                  <div className="w-12 h-12 rounded-full bg-clinic-100 flex items-center justify-center text-clinic-600 text-lg font-medium">
                    {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-clinic-900 truncate w-full">{p.firstName} {p.lastName}</span>
                </button>
              ))}
              {patients.length === 0 && (
                <div className="flex flex-col items-center gap-2 p-8 rounded-xl border border-clinic-200 text-center text-clinic-500 min-w-[140px]">
                  No patients. Add patients first.
                </div>
              )}
            </div>
          </div>
        </Card>

        {selectedChart && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tooth Chart */}
            <div className="lg:col-span-2">
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-clinic-900">Tooth Chart</h2>
                    <p className="text-clinic-500 text-sm">{patients.find(p => p.id === selectedChart!.patientId)?.firstName}</p>
                  </div>
                  <Button variant="outline" size="sm">Save Chart</Button>
                </div>
                <div className="grid grid-cols-8 gap-2 max-w-[500px] mx-auto">
                  {TOOTH_NUMBERS.map(num => (
                    <button
                      key={num}
                      onClick={() => {}}
                      className="aspect-square border border-clinic-300 rounded-lg text-xs font-medium text-clinic-600 hover:bg-synapse-50 hover:border-synapse-400 transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-4 gap-4">
                  {TOOTH_CONDITIONS.map(cond => (
                    <button
                      key={cond}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-clinic-200 text-sm text-clinic-700 hover:bg-clinic-50 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-clinic-500" />
                      {cond.replace(/_/g, ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Treatment Plan */}
            <Card className="lg:col-span-1">
              <h2 className="text-lg font-semibold text-clinic-900 mb-4">Treatment Plan</h2>
              <Table
                columns={['Tooth', 'Procedure', 'Fee (ZAR)', 'Status']}
                data={[]}
                renderCell={(row, col) => String(row[col] ?? '-')}
                emptyMessage="No treatment plan items. Add a procedure."
              />
              <div className="mt-6 pt-4 border-t border-clinic-100">
                <Input label="Procedure Code" placeholder="e.g. 8151" />
                <Input label="Description" placeholder="e.g. Composite filling" />
                <Input label="Estimated Fee (ZAR)" type="number" />
                <div className="flex justify-end mt-4">
                  <Button variant="primary">Add to Plan</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {!selectedChart && patients.length > 0 && (
          <div className="bg-clinic-50 rounded-xl p-8 text-center border border-clinic-200">
            <span className="text-4xl mb-4 block">🦷</span>
            <h3 className="text-lg font-semibold text-clinic-900 mb-2">Select a patient to begin</h3>
            <p className="text-clinic-500 text-sm">Choose a patient from the list above to view or create their dental odontogram chart.</p>
          </div>
        )}
      </Layout>
    </>
  );
}
