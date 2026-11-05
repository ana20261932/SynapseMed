import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/apiClient';
import { Layout } from '@/components/layout/Layout';
import { Card, Button, Input, Badge, Table } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';

interface User { id: string; email: string; firstName: string; lastName: string; }
interface Practice { id: string; name: string; role: string; }
interface SubscriptionPlan { id: string; name: string; description?: string; priceZar: number; billingPeriod: string; maxUsers?: number; featureFlags: string; isActive: boolean; }
interface Subscription { id: string; planId: string; plan?: SubscriptionPlan; status: string; providerRef?: string; currentPeriodStart: string; currentPeriodEnd: string; cancelledAt?: string; createdAt: string; }
interface PmsInvoice { id: string; invoiceNumber: string; status: string; amountZar: number; vatZar: number; periodStart: string; periodEnd: string; issuedAt?: string; paidAt?: string; lines?: Array<{ description: string; quantity: number; unitPriceZar: number; totalZar: number }>; }
interface SwitchConnection { id: string; providerName: string; environment: string; connectionStatus: string; contractApproved: boolean; approvedAt?: string; createdAt: string; }
interface SwitchUsageEvent { id: string; eventType: string; isMock: boolean; status: string; providerRef?: string; approvedAmountZar?: number; providerFeeZar: number; platformFeeZar: number; createdAt: string; }
interface SwitchInvoice { id: string; invoiceNumber: string; status: string; totalProviderFeesZar: number; totalPlatformFeesZar: number; totalZar: number; vatZar: number; periodStart: string; periodEnd: string; issuedAt?: string; paidAt?: string; }

const TAB_COLORS: Record<string, string> = {
  draft: 'bg-clinic-50 text-clinic-600 border border-clinic-200',
  active: 'bg-synapse-50 text-synapse-700 border border-synapse-100',
  cancelled: 'bg-red-50 text-red-700 border border-red-100',
  past_due: 'bg-amber-50 text-amber-700 border border-amber-100',
  paid: 'bg-green-50 text-green-700 border border-green-100',
  simulated: 'bg-clinic-100 text-clinic-600 border border-clinic-200',
  approved: 'bg-green-50 text-green-700 border border-green-100',
  rejected: 'bg-red-50 text-red-700 border border-red-100',
  not_connected: 'bg-clinic-100 text-clinic-600 border border-clinic-200',
  connected: 'bg-green-50 text-green-700 border border-green-100',
  mock: 'bg-amber-50 text-amber-700 border border-amber-100',
};

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [tab, setTab] = useState<'pms' | 'switch'>('pms');
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [pmsInvoices, setPmsInvoices] = useState<PmsInvoice[]>([]);
  const [switchConnection, setSwitchConnection] = useState<SwitchConnection | null>(null);
  const [switchEvents, setSwitchEvents] = useState<SwitchUsageEvent[]>([]);
  const [switchInvoices, setSwitchInvoices] = useState<SwitchInvoice[]>([]);
  const [addSubOpen, setAddSubOpen] = useState(false);

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
      apiClient.get<SubscriptionPlan[]>('/api/v1/subscriptions/plans', token),
      apiClient.get<Subscription>(`/api/v1/practices/${activePractice.id}/subscription`, token),
      apiClient.get<PmsInvoice[]>(`/api/v1/practices/${activePractice.id}/pms-invoices`, token),
      apiClient.get<SwitchConnection>(`/api/v1/practices/${activePractice.id}/switch-connection`, token),
      apiClient.get<SwitchUsageEvent[]>(`/api/v1/practices/${activePractice.id}/switch-usage`, token),
      apiClient.get<SwitchInvoice[]>(`/api/v1/practices/${activePractice.id}/switch-invoices`, token),
    ])
      .then(([plansRes, subRes, invRes, connRes, eventsRes, switchInvRes]) => {
        setPlans(plansRes);
        setSubscription(subRes ?? null);
        setPmsInvoices(invRes);
        setSwitchConnection(connRes ?? null);
        setSwitchEvents(eventsRes);
        setSwitchInvoices(switchInvRes);
      })
      .catch(() => {
        setPlans([]); setSubscription(null); setPmsInvoices([]);
        setSwitchConnection(null); setSwitchEvents([]); setSwitchInvoices([]);
      });
  }, [activePractice]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;

  return (
    <>
      <Head><title>Billing & Subscriptions — SynapseMed</title></Head>
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
              <h1 className="text-3xl font-bold text-clinic-900">Billing & Subscriptions</h1>
              <p className="text-clinic-500 text-sm">PMS subscription and insurance-switch billing (separate ledgers)</p>
            </div>
          </div>
          <div className="dev-banner mt-4">
            ⚠️ Development environment — synthetic data only. Not for clinical use. Mock switch — all simulated transactions labelled.
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-clinic-200">
          <button
            onClick={() => setTab('pms')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'pms' ? 'border-synapse-600 text-synapse-700 bg-synapse-50' : 'border-transparent text-clinic-500 hover:text-clinic-900 hover:bg-clinic-50'
            }`}
          >
            PMS Subscription
          </button>
          <button
            onClick={() => setTab('switch')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'switch' ? 'border-synapse-600 text-synapse-700 bg-synapse-50' : 'border-transparent text-clinic-500 hover:text-clinic-900 hover:bg-clinic-50'
            }`}
          >
            Insurance Switch
          </button>
        </div>

        {tab === 'pms' ? (
          <div>
            {/* Current Subscription */}
            <Card className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-clinic-900">Current Subscription</h2>
                {!subscription && (
                  <Button variant="outline" onClick={() => setAddSubOpen(true)}>Select Plan</Button>
                )}
              </div>
              {subscription ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl border border-clinic-200 bg-white">
                    <p className="text-xs font-semibold text-clinic-500 uppercase">Plan</p>
                    <p className="text-lg font-bold text-clinic-900">{subscription.plan?.name}</p>
                    <p className="text-xs text-clinic-500 mt-1">{subscription.plan?.billingPeriod}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-clinic-200 bg-white">
                    <p className="text-xs font-semibold text-clinic-500 uppercase">Status</p>
                    <Badge variant="default" className={TAB_COLORS[subscription.status] || ''}>{subscription.status.toUpperCase()}</Badge>
                  </div>
                  <div className="p-4 rounded-xl border border-clinic-200 bg-white">
                    <p className="text-xs font-semibold text-clinic-500 uppercase">Period</p>
                    <p className="text-sm text-clinic-900">
                      {new Date(subscription.currentPeriodStart).toLocaleDateString()} —{' '}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border border-clinic-200 rounded-xl bg-clinic-50">
                  <p className="text-clinic-500 text-sm">No active subscription. Select a plan to begin.</p>
                </div>
              )}
            </Card>

            {/* Plan Catalogue */}
            <Card className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-clinic-900">Available Plans</h2>
                <p className="text-clinic-500 text-sm">PMS plans only. Switch billing is separate.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {plans.map(plan => (
                  <Card key={plan.id} className="cursor-pointer hover:shadow-card-hover transition-shadow p-6">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-clinic-900">{plan.name}</span>
                      {plan.isActive && <Badge variant="success" className="text-[10px] px-2 py-1">Active</Badge>}
                    </div>
                    <p className="text-clinic-600 text-sm mb-4">{plan.description}</p>
                    <div className="text-3xl font-bold text-clinic-900 mb-1">R{plan.priceZar}</div>
                    <p className="text-xs text-clinic-500 mb-4">/{plan.billingPeriod}</p>
                    {plan.maxUsers && (
                      <p className="text-xs text-clinic-500 mb-4">Up to {plan.maxUsers} users</p>
                    )}
                    <button
                      onClick={() => setAddSubOpen(true)}
                      className="w-full py-2 rounded-lg text-sm font-medium transition-colors border border-synapse-600 text-synapse-600 hover:bg-synapse-600 hover:text-white"
                    >
                      Select Plan
                    </button>
                  </Card>
                ))}
                {plans.length === 0 && (
                  <div className="col-span-full text-center py-8 text-clinic-500 text-sm">No plans available.</div>
                )}
              </div>
            </Card>

            {/* PMS Invoices */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-clinic-900">PMS Invoices</h2>
                <p className="text-clinic-500 text-sm">Separate from switch invoices.</p>
              </div>
              <Table
                columns={['Invoice #', 'Amount (ZAR)', 'VAT', 'Status', 'Period', 'Issued', 'Actions']}
                data={pmsInvoices}
                renderCell={(row, col) => {
                  if (col === 'Invoice #') return <span className="font-medium text-clinic-900">{row.invoiceNumber}</span>;
                  if (col === 'Amount (ZAR)') return <span className="font-medium text-clinic-900">R{row.amountZar.toFixed(2)}</span>;
                  if (col === 'VAT') return <span className="text-clinic-600">R{row.vatZar.toFixed(2)}</span>;
                  if (col === 'Status') return <Badge variant="default" className={TAB_COLORS[row.status] || ''}>{row.status.toUpperCase()}</Badge>;
                  if (col === 'Period') return <span className="text-clinic-600 text-sm">{new Date(row.periodStart).toLocaleDateString()} — {new Date(row.periodEnd).toLocaleDateString()}</span>;
                  if (col === 'Issued') return <span className="text-clinic-600 text-sm">{row.issuedAt ? new Date(row.issuedAt).toLocaleDateString() : '—'}</span>;
                  if (col === 'Actions') return <div className="flex gap-2"><Button variant="ghost" size="sm">View</Button><Button variant="outline" size="sm">Pay</Button></div>;
                  return String(row[col]);
                }}
                emptyMessage="No PMS invoices."
              />
            </Card>
          </div>
        ) : (
          <div>
            {/* Switch Connection */}
            <Card className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-clinic-900">Insurance Switch Connection</h2>
                <p className="text-clinic-500 text-sm">Separate ledger from PMS subscription.</p>
              </div>
              {switchConnection ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl border border-clinic-200 bg-white">
                    <p className="text-xs font-semibold text-clinic-500 uppercase">Provider</p>
                    <p className="text-lg font-bold text-clinic-900">{switchConnection.providerName}</p>
                    <p className="text-xs text-clinic-500 mt-1">{switchConnection.environment}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-clinic-200 bg-white">
                    <p className="text-xs font-semibold text-clinic-500 uppercase">Connection Status</p>
                    <Badge variant="default" className={TAB_COLORS[switchConnection.connectionStatus] || ''}>{switchConnection.connectionStatus.toUpperCase()}</Badge>
                  </div>
                  <div className="p-4 rounded-xl border border-clinic-200 bg-white">
                    <p className="text-xs font-semibold text-clinic-500 uppercase">Contract</p>
                    <Badge variant={switchConnection.contractApproved ? 'verified' : 'warning'}>
                      {switchConnection.contractApproved ? 'APPROVED' : 'PENDING'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border border-clinic-200 rounded-xl bg-clinic-50">
                  <p className="text-clinic-500 text-sm">No switch connection configured. PMS operates independently without switch access.</p>
                  <div className="mt-4">
                    <Button variant="outline" disabled>Connect Switch</Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Switch Usage Events */}
            <Card className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-clinic-900">Switch Usage Events</h2>
                <Badge variant="default" className={TAB_COLORS.mock}>Mock</Badge>
              </div>
              <Table
                columns={['Event Type', 'Provider Ref', 'Status', 'Approved Amount', 'Provider Fee', 'Platform Fee', 'Date']}
                data={switchEvents}
                renderCell={(row, col) => {
                  if (col === 'Event Type') return <span className="text-clinic-600 text-sm capitalize">{row.eventType.replace(/_/g, ' ')}</span>;
                  if (col === 'Provider Ref') return <span className="text-clinic-600 text-sm">{row.providerRef || '—'}</span>;
                  if (col === 'Status') return <Badge variant="default" className={TAB_COLORS[row.status] || ''}>{row.status.toUpperCase()}</Badge>;
                  if (col === 'Approved Amount') return <span className="text-clinic-600 text-sm">{row.approvedAmountZar !== undefined ? `R${row.approvedAmountZar.toFixed(2)}` : '—'}</span>;
                  if (col === 'Provider Fee') return <span className="text-clinic-600 text-sm">R{row.providerFeeZar.toFixed(2)}</span>;
                  if (col === 'Platform Fee') return <span className="text-clinic-600 text-sm">R{row.platformFeeZar.toFixed(2)}</span>;
                  if (col === 'Date') return <span className="text-clinic-600 text-sm">{new Date(row.createdAt).toLocaleDateString()}</span>;
                  return String(row[col]);
                }}
                emptyMessage="No switch usage events."
              />
            </Card>

            {/* Switch Invoices */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-clinic-900">Switch Invoices</h2>
                <p className="text-clinic-500 text-sm">Separate from PMS invoices.</p>
              </div>
              <Table
                columns={['Invoice #', 'Provider Fees', 'Platform Fees', 'VAT', 'Total (ZAR)', 'Status', 'Period']}
                data={switchInvoices}
                renderCell={(row, col) => {
                  if (col === 'Invoice #') return <span className="font-medium text-clinic-900">{row.invoiceNumber}</span>;
                  if (col === 'Provider Fees') return <span className="text-clinic-600">R{row.totalProviderFeesZar.toFixed(2)}</span>;
                  if (col === 'Platform Fees') return <span className="text-clinic-600">R{row.totalPlatformFeesZar.toFixed(2)}</span>;
                  if (col === 'VAT') return <span className="text-clinic-600">R{row.vatZar.toFixed(2)}</span>;
                  if (col === 'Total (ZAR)') return <span className="font-medium text-clinic-900">R{row.totalZar.toFixed(2)}</span>;
                  if (col === 'Status') return <Badge variant="default" className={TAB_COLORS[row.status] || ''}>{row.status.toUpperCase()}</Badge>;
                  if (col === 'Period') return <span className="text-clinic-600 text-sm">{new Date(row.periodStart).toLocaleDateString()} — {new Date(row.periodEnd).toLocaleDateString()}</span>;
                  return String(row[col]);
                }}
                emptyMessage="No switch invoices."
              />
            </Card>
          </div>
        )}

        <Modal
          isOpen={addSubOpen}
          onClose={() => setAddSubOpen(false)}
          title="Select Subscription Plan"
          size="md"
        >
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setAddSubOpen(false); }}>
            <div className="space-y-3">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setAddSubOpen(false)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    plan.priceZar === 0 ? 'bg-clinic-50 border-clinic-200' : 'bg-white border-clinic-200'
                  } hover:border-synapse-400`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-clinic-900">{plan.name}</span>
                    {plan.priceZar === 0 && <Badge variant="success" className="text-[10px] px-2 py-1">Free</Badge>}
                  </div>
                  <p className="text-clinic-600 text-sm mb-2">{plan.description}</p>
                  <div className="text-2xl font-bold text-clinic-900">R{plan.priceZar}/{plan.billingPeriod}</div>
                  {plan.priceZar > 0 && (
                    <p className="text-xs text-clinic-500 mt-1">Payment method required for paid plans.</p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-clinic-100">
              <Button variant="outline" onClick={() => setAddSubOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Subscribe</Button>
            </div>
          </form>
        </Modal>
      </Layout>
    </>
  );
}
