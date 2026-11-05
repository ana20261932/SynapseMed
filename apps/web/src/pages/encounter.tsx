import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import { ClinicalEncounterCanvas } from '@/components/clinical/ClinicalEncounterCanvas';
import { apiClient } from '@/lib/apiClient';

interface User { id: string; email: string; firstName: string; lastName: string; }
interface Practice { id: string; name: string; role: string; }

export default function EncounterPage() {
  const router = useRouter();
  const { patientId } = router.query;
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);

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
      .catch(() => { localStorage.removeItem('accessToken'); router.push('/login'); });
  }, [router]);

  return (
    <>
      <Head><title>Clinical Encounter — SynapseMed</title></Head>
      <Layout
        user={user}
        practices={practices}
        activePractice={activePractice}
        onPracticeChange={(p) => setActivePractice(p)}
        onLogout={() => { localStorage.clear(); router.push('/login'); }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-clinic-900">Clinical Encounter</h1>
          <p className="text-clinic-500 text-sm">Template-driven encounter canvas with AI draft insights</p>
          <div className="dev-banner mt-3">
            ⚠️ Development environment — synthetic data only. All AI output requires clinician review.
          </div>
        </div>
        {activePractice && patientId && (
          <ClinicalEncounterCanvas patientId={String(patientId)} practiceId={activePractice.id} />
        )}
      </Layout>
    </>
  );
}
