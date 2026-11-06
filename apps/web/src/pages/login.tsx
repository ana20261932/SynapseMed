import { useState, FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/apiClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const data = await apiClient.post<{ accessToken: string; refreshToken: string }>('/api/v1/auth/login', { email, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      await router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally { setLoading(false); }
  }

  return (
    <>
      <Head><title>Sign in — SynapseMed</title></Head>

      {/* ── Page canvas ── */}
      <main
        className="min-h-screen flex flex-col"
        style={{ background: 'var(--color-bg-canvas)' }}
      >

        {/* ── Top nav ── */}
        <nav
          className="sk-topbar fixed top-0 left-0 right-0 z-40"
          style={{ height: 56 }}
        >
          <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'var(--color-accent-default)' }}
              >
                S
              </div>
              <span className="font-bold text-base tracking-tight" style={{ color: 'var(--color-fg-default)' }}>
                SynapseMed
              </span>
            </div>
            <Link
              href="/"
              className="text-sm font-medium"
              style={{ color: 'var(--color-fg-muted)' }}
            >
              ← Back to home
            </Link>
          </div>
        </nav>

        {/* ── Auth card ── */}
        <div className="flex-1 flex items-center justify-center px-4 pt-20 pb-12">
          <div className="w-full max-w-sm">

            {/* Icon + heading */}
            <div className="text-center mb-8">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--color-accent-subtle)', border: '1px solid var(--color-accent-muted)' }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--color-accent-fg)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h1
                className="text-2xl font-bold tracking-tight mb-1.5"
                style={{ color: 'var(--color-fg-default)' }}
              >
                Sign in
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
                Welcome back to your practice dashboard.
              </p>
            </div>

            {/* Card */}
            <div className="sk-card" style={{ padding: 'var(--space-6)' }}>

              {/* Error alert */}
              {error && (
                <div
                  className="sk-alert sk-alert-danger mb-5"
                >
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ minWidth: 16 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="sk-field-group">
                  <label className="sk-label" htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="sk-input"
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </div>

                {/* Password */}
                <div className="sk-field-group">
                  <label className="sk-label" htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="sk-input"
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="sk-btn sk-btn-primary sk-btn-md w-full mt-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in…
                    </>
                  ) : 'Sign in'}
                </button>
              </form>

              <p className="text-sm text-center mt-5" style={{ color: 'var(--color-fg-subtle)' }}>
                No account?{' '}
                <Link href="/register" className="font-medium" style={{ color: 'var(--color-accent-fg)' }}>
                  Create one
                </Link>
              </p>
            </div>

            {/* Dev notice */}
            <div className="sk-dev-banner mt-6">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span>Development mode — synthetic data only. Not for clinical use.</span>
            </div>
            <p
              className="text-center text-xs mt-3"
              style={{ color: 'var(--color-fg-subtle)' }}
            >
              Demo: <span style={{ color: 'var(--color-fg-muted)' }}>demo.owner@synapsemed.local</span> / DemoPass!2024
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
