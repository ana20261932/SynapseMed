import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/apiClient';
import { Layout } from '@/components/layout/Layout';
import { Card, Button, Badge } from '@/components/ui';
import { Input, Select } from '@/components/ui/Input';

interface User { id: string; email: string; firstName: string; lastName: string; }
interface Practice { id: string; name: string; role: string; moduleEntitlements?: Array<{ moduleKey: string; status: string }>; }
interface AIProvider { id: string; name: string; description: string; }

interface AISettings {
  aiProvider: string;
  geminiApiKey?: string | null;
  geminiModel?: string | null;
  watsonxApiKey?: string | null;
  watsonxProjectId?: string | null;
  watsonxModelId?: string | null;
  watsonxUrl?: string | null;
  opencodeApiKey?: string | null;
  opencodeBaseUrl?: string | null;
  opencodeModel?: string | null;
  autoTaskReminders: boolean;
  autoDoctorSetup: boolean;
  autoClaimBilling: boolean;
  reminderHoursBefore: number;
}

interface AutomationStatus {
  autoTaskReminders: boolean;
  autoDoctorSetup: boolean;
  autoClaimBilling: boolean;
  aiProvider: string;
}

function isMasked(val?: string | null) {
  return !!val && val.startsWith('••••');
}

export default function AISettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [settings, setSettings] = useState<AISettings>({
    aiProvider: 'mock',
    geminiModel: 'gemini-1.5-flash',
    watsonxModelId: 'ibm/granite-13b-chat-v2',
    opencodeBaseUrl: 'https://opencode.ai/zen/v1',
    opencodeModel: 'gpt-4o-mini',
    autoTaskReminders: false,
    autoDoctorSetup: false,
    autoClaimBilling: false,
    reminderHoursBefore: 24,
  });

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
        const pid = typeof router.query.practiceId === 'string' ? router.query.practiceId : null;
        setActivePractice(p.find(x => x.id === pid) || p[0] || null);
      })
      .catch(() => { localStorage.removeItem('accessToken'); router.push('/login'); })
      .finally(() => setLoading(false));
  }, [router]);

  async function loadSettings(practiceId: string) {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setError('');
    try {
      const [ai, auto] = await Promise.all([
        apiClient.get<{ settings: AISettings; availableProviders: AIProvider[] }>(`/api/v1/practices/${practiceId}/settings/ai`, token),
        apiClient.get<AutomationStatus>(`/api/v1/practices/${practiceId}/automation/status`, token),
      ]);
      setSettings({
        aiProvider: ai.settings?.aiProvider || 'mock',
        geminiApiKey: ai.settings?.geminiApiKey ?? null,
        geminiModel: ai.settings?.geminiModel || 'gemini-1.5-flash',
        watsonxApiKey: ai.settings?.watsonxApiKey ?? null,
        watsonxProjectId: ai.settings?.watsonxProjectId ?? null,
        watsonxModelId: ai.settings?.watsonxModelId || 'ibm/granite-13b-chat-v2',
        watsonxUrl: ai.settings?.watsonxUrl ?? null,
        opencodeApiKey: ai.settings?.opencodeApiKey ?? null,
        opencodeBaseUrl: ai.settings?.opencodeBaseUrl || 'https://opencode.ai/zen/v1',
        opencodeModel: ai.settings?.opencodeModel || 'gpt-4o-mini',
        autoTaskReminders: !!ai.settings?.autoTaskReminders,
        autoDoctorSetup: !!ai.settings?.autoDoctorSetup,
        autoClaimBilling: !!ai.settings?.autoClaimBilling,
        reminderHoursBefore: Number(ai.settings?.reminderHoursBefore || 24),
      });
      setProviders(ai.availableProviders || []);
      setStatus(auto);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load AI settings');
    }
  }

  useEffect(() => {
    if (!activePractice) return;
    void loadSettings(activePractice.id);
  }, [activePractice?.id]);

  const aiAdminActive = useMemo(() => {
    const ent = activePractice?.moduleEntitlements?.find(m => m.moduleKey === 'ai_admin');
    return !ent || ent.status === 'active'; // show page; API enforces
  }, [activePractice]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!activePractice) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const payload: Record<string, unknown> = {
        aiProvider: settings.aiProvider,
        geminiModel: settings.geminiModel,
        watsonxProjectId: settings.watsonxProjectId,
        watsonxModelId: settings.watsonxModelId,
        watsonxUrl: settings.watsonxUrl,
        opencodeBaseUrl: settings.opencodeBaseUrl,
        opencodeModel: settings.opencodeModel,
        autoTaskReminders: settings.autoTaskReminders,
        autoDoctorSetup: settings.autoDoctorSetup,
        autoClaimBilling: settings.autoClaimBilling,
        reminderHoursBefore: Number(settings.reminderHoursBefore || 24),
      };
      // Never resend masked keys; only send when user entered a new value.
      if (settings.geminiApiKey && !isMasked(settings.geminiApiKey)) payload.geminiApiKey = settings.geminiApiKey;
      if (settings.watsonxApiKey && !isMasked(settings.watsonxApiKey)) payload.watsonxApiKey = settings.watsonxApiKey;
      if (settings.opencodeApiKey && !isMasked(settings.opencodeApiKey)) payload.opencodeApiKey = settings.opencodeApiKey;

      await apiClient.put(`/api/v1/practices/${activePractice.id}/settings/ai`, payload, token);
      setNotice('AI & automation settings saved. Stored keys are masked after save.');
      await loadSettings(activePractice.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function runAutomation(kind: 'reminders' | 'doctor-setup' | 'claim-billing') {
    if (!activePractice) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setRunning(kind); setError(''); setNotice('');
    try {
      const path = kind === 'reminders' ? 'run-reminders' : kind === 'doctor-setup' ? 'run-doctor-setup' : 'run-claim-billing';
      const res = await apiClient.post<any>(`/api/v1/practices/${activePractice.id}/automation/${path}`, {}, token);
      setNotice(typeof res?.message === 'string' ? res.message : `Automation '${kind}' completed.`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : `Automation '${kind}' failed`);
    } finally {
      setRunning(null);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Not authenticated</div>;

  return (
    <>
      <Head><title>AI & Automation Settings — SynapseMed</title></Head>
      <Layout
        user={user}
        practices={practices}
        activePractice={activePractice}
        onPracticeChange={(p) => setActivePractice(p)}
        onLogout={() => { localStorage.clear(); router.push('/login'); }}
      >
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-clinic-900">AI & Automation Settings</h1>
              <p className="text-clinic-500 text-sm">Configure free AI providers and practice automations. Keys are stored server-side and masked in the UI.</p>
            </div>
            {status && <Badge variant="info">Provider: {status.aiProvider}</Badge>}
          </div>
          <div className="dev-banner mt-4">
            ⚠️ Safety: AI output is draft-only and requires qualified clinical or authorized billing review. No autonomous diagnosis, prescription, clinical record amendment, or claim submission. Use synthetic/demo data in development.
          </div>
          {!aiAdminActive && <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">AI admin module may be inactive for this practice; API actions can be blocked until enabled.</div>}
        </div>

        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
        {notice && <div className="mb-4 bg-synapse-50 border border-synapse-200 text-synapse-800 text-sm rounded-xl px-4 py-3">{notice}</div>}

        <form className="space-y-6" onSubmit={save}>
          <Card>
            <h2 className="text-lg font-semibold text-clinic-900 mb-1">AI Provider</h2>
            <p className="text-sm text-clinic-500 mb-4">Select the provider used by AI-assisted workflows. Free tiers: Google Gemini, opencode. IBM watsonx.ai can be configured when credentials are available.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Provider" value={settings.aiProvider} onChange={e => setSettings(s => ({ ...s, aiProvider: e.target.value }))}>
                {(providers.length ? providers : [
                  { id: 'mock', name: 'Mock (Development)' },
                  { id: 'gemini', name: 'Google Gemini (Free Tier)' },
                  { id: 'watsonx', name: 'IBM watsonx.ai' },
                  { id: 'opencode', name: 'Opencode (Free)' },
                ]).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              <div className="text-xs text-clinic-500 flex items-end pb-2">{providers.find(p => p.id === settings.aiProvider)?.description || 'Mock provider is safe for local development.'}</div>
            </div>
          </Card>

          {settings.aiProvider === 'gemini' && (
            <Card>
              <h2 className="text-lg font-semibold text-clinic-900 mb-4">Google Gemini (Free Tier)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Gemini API Key" type="password" value={settings.geminiApiKey || ''} onChange={e => setSettings(s => ({ ...s, geminiApiKey: e.target.value }))} placeholder={isMasked(settings.geminiApiKey) ? 'Saved key (enter new value to replace)' : 'Enter Gemini API key'} helperText="Leave masked value unchanged to keep the existing key." />
                <Input label="Model" value={settings.geminiModel || ''} onChange={e => setSettings(s => ({ ...s, geminiModel: e.target.value }))} placeholder="gemini-1.5-flash" />
              </div>
            </Card>
          )}

          {settings.aiProvider === 'watsonx' && (
            <Card>
              <h2 className="text-lg font-semibold text-clinic-900 mb-4">IBM watsonx.ai</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="watsonx API Key" type="password" value={settings.watsonxApiKey || ''} onChange={e => setSettings(s => ({ ...s, watsonxApiKey: e.target.value }))} placeholder={isMasked(settings.watsonxApiKey) ? 'Saved key (enter new value to replace)' : 'Enter watsonx API key'} helperText="Leave masked value unchanged to keep the existing key." />
                <Input label="Project ID" value={settings.watsonxProjectId || ''} onChange={e => setSettings(s => ({ ...s, watsonxProjectId: e.target.value }))} placeholder="watsonx project id" />
                <Input label="Model ID" value={settings.watsonxModelId || ''} onChange={e => setSettings(s => ({ ...s, watsonxModelId: e.target.value }))} placeholder="ibm/granite-13b-chat-v2" />
                <Input label="API URL (optional)" value={settings.watsonxUrl || ''} onChange={e => setSettings(s => ({ ...s, watsonxUrl: e.target.value }))} placeholder="https://..." />
              </div>
            </Card>
          )}

          {settings.aiProvider === 'opencode' && (
            <Card>
              <h2 className="text-lg font-semibold text-clinic-900 mb-4">Opencode (Free)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Opencode API Key" type="password" value={settings.opencodeApiKey || ''} onChange={e => setSettings(s => ({ ...s, opencodeApiKey: e.target.value }))} placeholder={isMasked(settings.opencodeApiKey) ? 'Saved key (enter new value to replace)' : 'Enter opencode API key'} helperText="Leave masked value unchanged to keep the existing key." />
                <Input label="Base URL" value={settings.opencodeBaseUrl || ''} onChange={e => setSettings(s => ({ ...s, opencodeBaseUrl: e.target.value }))} placeholder="https://opencode.ai/zen/v1" />
                <Input label="Model" value={settings.opencodeModel || ''} onChange={e => setSettings(s => ({ ...s, opencodeModel: e.target.value }))} placeholder="gpt-4o-mini" />
              </div>
            </Card>
          )}

          <Card>
            <h2 className="text-lg font-semibold text-clinic-900 mb-1">Automations</h2>
            <p className="text-sm text-clinic-500 mb-4">Automations run only when enabled and permitted. Doctor setup and claim billing produce draft/review outputs and never perform autonomous clinical or claim submission actions.</p>
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-3 border border-clinic-200 rounded-xl">
                <input type="checkbox" className="mt-1" checked={settings.autoTaskReminders} onChange={e => setSettings(s => ({ ...s, autoTaskReminders: e.target.checked }))} />
                <div>
                  <div className="font-medium text-clinic-900">Auto doctor task reminders</div>
                  <div className="text-sm text-clinic-500">Generate reminders for upcoming booked/checked-in appointments within the reminder window.</div>
                </div>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Reminder window (hours before)" type="number" min={1} max={168} value={String(settings.reminderHoursBefore ?? 24)} onChange={e => setSettings(s => ({ ...s, reminderHoursBefore: Number(e.target.value || 24) }))} />
              </div>
              <label className="flex items-start gap-3 p-3 border border-clinic-200 rounded-xl">
                <input type="checkbox" className="mt-1" checked={settings.autoDoctorSetup} onChange={e => setSettings(s => ({ ...s, autoDoctorSetup: e.target.checked }))} />
                <div>
                  <div className="font-medium text-clinic-900">Auto doctor setup (draft/checklist)</div>
                  <div className="text-sm text-clinic-500">Creates a reviewable onboarding/setup checklist for practitioners. It does not change roles, verify registrations, enable modules, or access clinical data autonomously.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border border-amber-200 rounded-xl bg-amber-50/40">
                <input type="checkbox" className="mt-1" checked={settings.autoClaimBilling} onChange={e => setSettings(s => ({ ...s, autoClaimBilling: e.target.checked }))} />
                <div>
                  <div className="font-medium text-clinic-900">Auto claim billing preparation (review required)</div>
                  <div className="text-sm text-clinic-600">Prepares/surfaces claim billing items for human review only. It never submits claims to a medical-aid switch automatically.</div>
                </div>
              </label>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-clinic-900 mb-1">Run automations now</h2>
            <p className="text-sm text-clinic-500 mb-4">Manual runs use saved settings and API permissions. Results may be draft-only and require review.</p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" disabled={running !== null || !settings.autoTaskReminders} isLoading={running === 'reminders'} onClick={() => runAutomation('reminders')}>Run task reminders</Button>
              <Button type="button" variant="outline" disabled={running !== null || !settings.autoDoctorSetup} isLoading={running === 'doctor-setup'} onClick={() => runAutomation('doctor-setup')}>Run doctor setup</Button>
              <Button type="button" variant="outline" disabled={running !== null || !settings.autoClaimBilling} isLoading={running === 'claim-billing'} onClick={() => runAutomation('claim-billing')}>Run claim billing prep</Button>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => activePractice && loadSettings(activePractice.id)} disabled={saving || running !== null}>Reset</Button>
            <Button type="submit" variant="primary" isLoading={saving} disabled={saving || running !== null || !activePractice}>Save settings</Button>
          </div>
        </form>
      </Layout>
    </>
  );
}
