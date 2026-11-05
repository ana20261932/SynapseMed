import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/apiClient';
import { Layout } from '@/components/layout/Layout';
import { Card, Button, Input, Badge, Table } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';

interface User { id: string; email: string; firstName: string; lastName: string; }
interface Practice { id: string; name: string; organisationType: string; timezone: string; role: string; moduleEntitlements?: Array<{ moduleKey: string; status: string }>; }

interface ModuleOption {
  key: string;
  label: string;
  description: string;
  category: 'core' | 'specialty';
}

const MODULES: ModuleOption[] = [
  { key: 'scheduling', label: 'Appointment Scheduling', description: 'Book, reschedule and manage patient appointments', category: 'core' },
  { key: 'clinical_notes', label: 'Clinical Notes', description: 'Document encounters with draft/signed workflow', category: 'core' },
  { key: 'billing', label: 'Billing & Invoicing', description: 'Generate PMS invoices and track payments', category: 'core' },
  { key: 'dental_odontogram', label: 'Dental Odontogram', description: 'Tooth chart and dental procedure tracking', category: 'specialty' },
  { key: 'dental_procedures', label: 'Dental Procedures', description: 'Dental treatment plans and procedure codes', category: 'specialty' },
  { key: 'radiology_orders', label: 'Radiology Orders', description: 'Imaging orders and modality worklist', category: 'specialty' },
  { key: 'radiology_reports', label: 'Radiology Reports', description: 'Draft and sign radiology reports', category: 'specialty' },
  { key: 'mental_health_records', label: 'Mental Health Records', description: 'Restricted-access psychiatric notes', category: 'specialty' },
  { key: 'treatment_plans', label: 'Treatment Plans', description: 'Care plans and treatment tracking', category: 'specialty' },
  { key: 'nursing_observations', label: 'Nursing Observations', description: 'Vitals and care plan documentation', category: 'specialty' },
  { key: 'pharmacy_inventory', label: 'Pharmacy Inventory', description: 'Stock, batch and expiry tracking', category: 'specialty' },
  { key: 'medication_workflow', label: 'Medication Workflow', description: 'Prescription and dispensing workflow', category: 'specialty' },
  { key: 'lab_orders', label: 'Laboratory Orders', description: 'Lab orders and specimen tracking', category: 'specialty' },
  { key: 'results', label: 'Results Management', description: 'Lab result entry and review', category: 'specialty' },
];

const ORG_TYPES = [
  { value: 'independent_practitioner', label: 'Independent Practitioner' },
  { value: 'group_practice', label: 'Group Practice' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'imaging_centre', label: 'Imaging Centre' },
  { value: 'laboratory', label: 'Laboratory' },
  { value: 'hospital', label: 'Hospital' },
];

export default function PracticeBuilderPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activeStep, setActiveStep] = useState(1);
  const [form, setForm] = useState({
    practiceName: '',
    organisationType: '',
    phone: '',
    email: '',
    address: '',
    timezone: 'Africa/Johannesburg',
    discipline: '',
    councilBody: '',
    registrationNumber: '',
    practiceNumber: '',
    registrationStatus: 'unverified' as const,
    selectedModules: [] as string[],
    planType: 'free',
  });
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const totalSteps = 5;

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    Promise.all([
      apiClient.get<User>('/api/v1/auth/me', token),
      apiClient.get<Practice[]>('/api/v1/practices', token),
    ])
      .then(([u, p]) => { setUser(u); setPractices(p); })
      .catch(() => { localStorage.removeItem('accessToken'); router.push('/login'); })
      .finally(() => setLoading(false));
  }, [router]);

  const completedSteps = Math.min(activeStep - 1, totalSteps);
  const progress = (completedSteps / totalSteps) * 100;

  function nextStep() {
    if (activeStep < totalSteps) setActiveStep(activeStep + 1);
  }
  function prevStep() {
    if (activeStep > 1) setActiveStep(activeStep - 1);
  }

  function handleCreatePractice() {
    setCreateError('');
    setCreateOpen(true);
  }

  async function submitCreatePractice() {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setCreating(true);
    setCreateError('');
    try {
      await apiClient.post<Practice>('/api/v1/practices', {
        name: form.practiceName,
        organisationType: form.organisationType,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        timezone: form.timezone,
      }, token);
      setCreateOpen(false);
      router.push('/dashboard');
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create practice');
    } finally {
      setCreating(false);
    }
  }

  function toggleModule(key: string) {
    setForm(prev => ({
      ...prev,
      selectedModules: prev.selectedModules.includes(key)
        ? prev.selectedModules.filter(k => k !== key)
        : [...prev.selectedModules, key],
    }));
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;

  return (
    <>
      <Head><title>Practice Builder — SynapseMed</title></Head>
      <Layout
        user={user}
        practices={practices}
        activePractice={null}
        onPracticeChange={() => {}}
        onLogout={() => { localStorage.clear(); router.push('/login'); }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-clinic-900">Practice Builder</h1>
            <p className="text-clinic-500 text-sm">Configure your practice, select modules and set up billing.</p>
            <div className="dev-banner mt-4">
              ⚠️ Development environment — synthetic data only. Not for clinical use.
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-clinic-700">Setup Progress</span>
              <span className="text-sm font-medium text-clinic-900">{completedSteps} / {totalSteps} steps</span>
            </div>
            <div className="w-full bg-clinic-200 rounded-full h-2">
              <div className="bg-synapse-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 gap-6">
            {activeStep === 1 && (
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 bg-synapse-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <h2 className="text-lg font-semibold text-clinic-900">Practice Details</h2>
                </div>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
                  <Input label="Practice Name" value={form.practiceName} onChange={e => setForm(p => ({ ...p, practiceName: e.target.value }))} required />
                  <Input label="Organisation Name" value={form.practiceName} onChange={e => setForm(p => ({ ...p, practiceName: e.target.value }))} />
                  <select value={form.organisationType} onChange={e => setForm(p => ({ ...p, organisationType: e.target.value }))} className="w-full border border-clinic-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500" required>
                    <option value="">Select organisation type</option>
                    {ORG_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                    <Input label="Email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <Input label="Address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                  <Input label="Timezone" value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))} />
                  <div className="flex justify-end mt-8">
                    <Button variant="primary" type="submit">Continue →</Button>
                  </div>
                </form>
              </Card>
            )}

            {activeStep === 2 && (
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 bg-synapse-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <h2 className="text-lg font-semibold text-clinic-900">Professional Registration</h2>
                </div>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
                  <Input label="Professional Discipline" value={form.discipline} onChange={e => setForm(p => ({ ...p, discipline: e.target.value }))} placeholder="e.g. General Practice, Dentistry, Radiology" required />
                  <Input label="Council / Registration Body" value={form.councilBody} onChange={e => setForm(p => ({ ...p, councilBody: e.target.value }))} />
                  <Input label="Registration Number" value={form.registrationNumber} onChange={e => setForm(p => ({ ...p, registrationNumber: e.target.value }))} />
                  <Input label="Practice Number" value={form.practiceNumber} onChange={e => setForm(p => ({ ...p, practiceNumber: e.target.value }))} />
                  <select value={form.registrationStatus} onChange={e => setForm(p => ({ ...p, registrationStatus: e.target.value as any }))} className="w-full border border-clinic-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500">
                    <option value="unverified">Unverified</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                    <option value="expired">Expired</option>
                  </select>
                  <p className="text-xs text-clinic-500">Registration status is explicitly tracked — never inferred.</p>
                  <div className="flex justify-between mt-8">
                    <Button variant="outline" onClick={prevStep}>Back</Button>
                    <Button variant="primary" type="submit">Continue →</Button>
                  </div>
                </form>
              </Card>
            )}

            {activeStep === 3 && (
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 bg-synapse-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <h2 className="text-lg font-semibold text-clinic-900">Select Modules</h2>
                </div>
                <div className="space-y-3">
                  {MODULES.map(m => (
                    <div key={m.key} className="flex items-center justify-between p-4 border border-clinic-200 rounded-xl bg-white hover:bg-clinic-50 transition-colors cursor-pointer group" onClick={() => toggleModule(m.key)}>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={form.selectedModules.includes(m.key)}
                          onChange={() => toggleModule(m.key)}
                          className="w-4 h-4 text-synapse-600 border-clinic-300 rounded focus:ring-synapse-500"
                        />
                        <div>
                          <span className={`font-medium text-clinic-900 ${form.selectedModules.includes(m.key) ? 'text-synapse-700' : ''}`}>{m.label}</span>
                          <p className="text-xs text-clinic-500 mt-0.5">{m.description}</p>
                        </div>
                      </div>
                      <Badge variant={m.category === 'core' ? 'info' : 'default'}>{m.category}</Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-clinic-500 mt-4">Select the modules your practice needs. Core modules are included in all plans.</p>
                <div className="flex justify-between mt-8">
                  <Button variant="outline" onClick={prevStep}>Back</Button>
                  <Button variant="primary" onClick={nextStep}>Continue →</Button>
                </div>
              </Card>
            )}

            {activeStep === 4 && (
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 bg-synapse-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <h2 className="text-lg font-semibold text-clinic-900">Plan & Billing</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-clinic-700 mb-2">Subscription Plan</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { name: 'Free', price: 'R0', desc: 'Core modules, up to 3 users', recommended: false },
                        { name: 'Standard', price: 'R499/month', desc: 'All core modules, up to 10 users', recommended: true },
                        { name: 'Professional', price: 'R999/month', desc: 'All modules, unlimited users, switch access', recommended: false },
                      ].map((plan, i) => (
                        <div key={plan.name} className={`p-4 rounded-xl border-2 ${i === 1 ? 'border-synapse-600 bg-synapse-50' : 'border-clinic-200 bg-white'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-clinic-900">{plan.name}</span>
                            {plan.recommended && <Badge variant="success">Recommended</Badge>}
                          </div>
                          <div className="text-2xl font-bold text-clinic-900 mb-1">{plan.price}</div>
                          <p className="text-xs text-clinic-500">{plan.desc}</p>
                          <button
                            onClick={() => setForm(p => ({ ...p, planType: i === 0 ? 'free' : i === 1 ? 'standard' : 'professional' }))}
                            className={`w-full mt-3 py-2 rounded-lg text-sm font-medium transition-colors ${i === 1 ? 'bg-synapse-600 text-white' : 'bg-clinic-50 text-clinic-700 border border-clinic-200'}`}
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-800">PMS subscription and insurance-switch billing are separate ledgers. Switch access is optional and billed independently.</p>
                  </div>
                  <div className="flex justify-between mt-8">
                    <Button variant="outline" onClick={prevStep}>Back</Button>
                    <Button variant="primary" onClick={nextStep}>Continue →</Button>
                  </div>
                </div>
              </Card>
            )}

            {activeStep === 5 && (
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 bg-synapse-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                  <h2 className="text-lg font-semibold text-clinic-900">Review & Create</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-clinic-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-clinic-500 uppercase">Practice Name</p>
                      <p className="text-clinic-900">{form.practiceName || '—'}</p>
                    </div>
                    <div className="bg-clinic-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-clinic-500 uppercase">Organisation Type</p>
                      <p className="text-clinic-900">{ORG_TYPES.find(o => o.value === form.organisationType)?.label || '—'}</p>
                    </div>
                    <div className="bg-clinic-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-clinic-500 uppercase">Discipline</p>
                      <p className="text-clinic-900">{form.discipline || '—'}</p>
                    </div>
                    <div className="bg-clinic-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-clinic-500 uppercase">Registration Status</p>
                      <Badge variant="default">{form.registrationStatus}</Badge>
                    </div>
                    <div className="bg-clinic-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-clinic-500 uppercase">Modules</p>
                      <p className="text-clinic-900 text-sm">{form.selectedModules.length} selected</p>
                    </div>
                    <div className="bg-clinic-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-clinic-500 uppercase">Plan</p>
                      <p className="text-clinic-900">{form.planType}</p>
                    </div>
                  </div>
                  <div className="flex justify-between mt-8">
                    <Button variant="outline" onClick={prevStep}>Back</Button>
                    <Button variant="primary" onClick={handleCreatePractice}>Create Practice</Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        <Modal
          isOpen={createOpen}
          onClose={() => { if (!creating) setCreateOpen(false); }}
          title="Create Practice"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-clinic-700">Your practice "<strong>{form.practiceName}</strong>" will be created with {form.selectedModules.length} module(s) enabled.</p>
            <div className="bg-clinic-50 rounded-xl p-4 border border-clinic-200">
              <p className="text-sm text-clinic-600">You can add members, configure roles, and invite team members after creation.</p>
            </div>
            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{createError}</div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-clinic-100">
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>Back to Review</Button>
              <Button variant="primary" onClick={submitCreatePractice} disabled={creating}>{creating ? 'Creating…' : 'Create Practice'}</Button>
            </div>
          </div>
        </Modal>
      </Layout>
    </>
  );
}
