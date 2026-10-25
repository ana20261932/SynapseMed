import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/apiClient';

interface User { id: string; email: string; firstName: string; lastName: string; }
interface Practice { id: string; practice: { id: string; name: string; timezone: string; organisation: { name: string; type: string } }; role: string; }

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    Promise.all([apiClient.get<User>('/api/v1/auth/me', token), apiClient.get<Practice[]>('/api/v1/practices', token)])
      .then(([u, p]) => { setUser(u); setPractices(p); })
      .catch(() => { localStorage.removeItem('accessToken'); router.push('/login'); })
      .finally(() => setLoading(false));
  }, [router]);

  function logout() {
    const token = localStorage.getItem('accessToken');
    const refresh = localStorage.getItem('refreshToken');
    if (token) apiClient.post('/api/v1/auth/logout', { refreshToken: refresh }, token).catch(() => null);
    localStorage.clear(); router.push('/login');
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;

  return (
    <>
      <Head><title>Dashboard — SynapseMed</title></Head>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-gray-900">SynapseMed</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.firstName} {user?.lastName}</span>
            <button onClick={logout} className="text-sm text-red-600 hover:underline">Sign out</button>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-10">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg px-4 py-2 mb-8">
            ⚠️ Development environment — synthetic data only. Not for clinical use.
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Your practices</h1>
          {practices.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <p className="text-gray-500 mb-4">You are not a member of any practice yet.</p>
              <a href="/practices/new" className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium">Create a practice</a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {practices.map((m) => (
                <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900">{m.practice.name}</h2>
                      <p className="text-xs text-gray-400 mt-0.5">{m.practice.organisation.type.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 capitalize">{m.role}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">Timezone: {m.practice.timezone}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
