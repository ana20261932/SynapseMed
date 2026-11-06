import Head from 'next/head';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const upd = (f: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [f]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const data = await apiClient.post<{ accessToken: string; refreshToken: string }>('/api/v1/auth/register', {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      await router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <>
      <Head><title>Create account — SynapseMed</title></Head>
      <main className="min-h-screen bg-clinic-50">
        <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur border-b border-clinic-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-synapse-600 rounded-xl flex items-center justify-center text-white text-lg">S</div>
              <span className="font-bold text-xl text-clinic-900 tracking-tight">SynapseMed</span>
            </div>
            <Link href="/" className="text-clinic-600 hover:text-synapse-600 text-sm font-medium">← Back to home</Link>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="w-12 h-12 bg-synapse-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-synapse-600 font-bold text-lg">S</span>
            </div>
            <h1 className="text-3xl font-bold text-clinic-900 mb-3">Create your account</h1>
            <p className="text-clinic-600">Join South African practices using SynapseMed for patient management and medical-aid billing.</p>
          </div>

          <Card className="mx-auto">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-clinic-700 mb-1.5">First name</label>
                  <Input label="First name" value={form.firstName} onChange={upd('firstName')} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-clinic-700 mb-1.5">Last name</label>
                  <Input label="Last name" value={form.lastName} onChange={upd('lastName')} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-clinic-700 mb-1.5">Email</label>
                <Input label="Email" type="email" value={form.email} onChange={upd('email')} required autoComplete="email" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-clinic-700 mb-1.5">Password</label>
                <Input label="Password" type="password" value={form.password} onChange={upd('password')} required minLength={10} autoComplete="new-password" />
                <p className="text-xs text-clinic-500 mt-1">Minimum 10 characters</p>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Creating…' : 'Create account'}
              </button>
            </form>
            <p className="text-sm text-clinic-500 mt-6 text-center">
              Have an account? <Link href="/login" className="text-synapse-600 hover:underline font-medium">Sign in</Link>
            </p>
          </Card>

          <div className="mt-10 text-center">
            <div className="text-xs text-clinic-400 mb-3">⚠️ Development environment — synthetic data only. Not for clinical use.</div>
            <p className="text-xs text-clinic-400">Demo credentials: demo.owner@synapsemed.local / DemoPass!2024</p>
          </div>
        </div>
      </main>
    </>
  );
}
