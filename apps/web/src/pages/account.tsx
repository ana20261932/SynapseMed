import React, { useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardBody, Badge, Button } from '@/components/ui';

export default function AccountPage() {
  const [activePlan, setActivePlan] = useState<'solo' | 'clinic' | 'enterprise'>('enterprise');
  const [isUpdatingCard, setIsUpdatingCard] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handlePlanUpgrade = (tier: 'solo' | 'clinic' | 'enterprise') => {
    setActivePlan(tier);
    setSuccessMsg(`Commercial plan updated to ${tier.toUpperCase()}. Invoicing updated.`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <Layout>
      <Head>
        <title>Commercial Practice Account & CockroachDB | SynapseMed</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Practice Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-clinic-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-clinic-900 font-display">Commercial Practice Account</h1>
              <Badge variant="success">BHF #0428192 VERIFIED</Badge>
              <Badge variant="info">SARS VAT #ZA-4890128491</Badge>
            </div>
            <p className="text-sm text-clinic-500 mt-1">
              Sandton Medical Centre (Pty) Ltd · Multi-Tenant CockroachDB Partition & Render Production Cloud
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-mono font-bold">
              Production: https://synapsemed-za-prod.onrender.com
            </span>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-xl flex items-center justify-between">
            <span>✓ {successMsg}</span>
          </div>
        )}

        {/* Subscription Tiers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-clinic-900">Commercial Software Subscription Tiers</h2>
            <span className="text-xs text-clinic-500">Statutory separation: PMS licensing fee billed separately from claim switch fees</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Solo Tier */}
            <div className={`p-6 rounded-2xl border transition-all ${activePlan === 'solo' ? 'border-teal-600 bg-teal-50/40 shadow-sm' : 'border-clinic-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-clinic-600">Solo Practitioner</span>
                {activePlan === 'solo' && <Badge variant="success">Current Plan</Badge>}
              </div>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-clinic-900 font-mono">R1,450</span>
                <span className="text-xs text-clinic-500"> / month</span>
              </div>
              <ul className="text-xs text-clinic-600 space-y-2 mb-6">
                <li>✓ 1 Registered Clinician License</li>
                <li>✓ Clinical Encounter & AI SOAP Generator</li>
                <li>✓ Electronic Switch Claims (R3.50 / claim)</li>
                <li>✓ CockroachDB Dedicated Partition</li>
              </ul>
              <Button
                variant={activePlan === 'solo' ? 'secondary' : 'primary'}
                className="w-full text-xs"
                onClick={() => handlePlanUpgrade('solo')}
              >
                {activePlan === 'solo' ? 'Active Tier' : 'Downgrade to Solo'}
              </Button>
            </div>

            {/* Clinic Tier */}
            <div className={`p-6 rounded-2xl border transition-all ${activePlan === 'clinic' ? 'border-teal-600 bg-teal-50/40 shadow-sm' : 'border-clinic-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-clinic-600">Medical Clinic</span>
                {activePlan === 'clinic' && <Badge variant="success">Current Plan</Badge>}
              </div>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-clinic-900 font-mono">R3,250</span>
                <span className="text-xs text-clinic-500"> / month</span>
              </div>
              <ul className="text-xs text-clinic-600 space-y-2 mb-6">
                <li>✓ Up to 5 Registered Clinicians</li>
                <li>✓ Pharmacy Dispensing & NAPPI Stock</li>
                <li>✓ Electronic Medical Aid Adjudication</li>
                <li>✓ Role-based access control</li>
              </ul>
              <Button
                variant={activePlan === 'clinic' ? 'secondary' : 'primary'}
                className="w-full text-xs"
                onClick={() => handlePlanUpgrade('clinic')}
              >
                {activePlan === 'clinic' ? 'Active Tier' : 'Switch to Clinic'}
              </Button>
            </div>

            {/* Enterprise Tier */}
            <div className={`p-6 rounded-2xl border transition-all ${activePlan === 'enterprise' ? 'border-teal-600 bg-teal-50/40 shadow-sm ring-2 ring-teal-600/20' : 'border-clinic-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Enterprise Multidisciplinary</span>
                {activePlan === 'enterprise' && <Badge variant="success">Current Plan</Badge>}
              </div>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-clinic-900 font-mono">R7,800</span>
                <span className="text-xs text-clinic-500"> / month</span>
              </div>
              <ul className="text-xs text-clinic-600 space-y-2 mb-6">
                <li>✓ Unlimited Doctors, Radiologists, Pharmacists, Techs</li>
                <li>✓ Radiology PACS DICOM viewer with AI draft</li>
                <li>✓ Pathology Analyzer HL7/FHIR integration</li>
                <li>✓ Real-time Discovery, GEMS, Medscheme Switch</li>
                <li>✓ CockroachDB Cloud Multi-Region Cluster</li>
              </ul>
              <Button
                variant={activePlan === 'enterprise' ? 'secondary' : 'primary'}
                className="w-full text-xs"
                onClick={() => handlePlanUpgrade('enterprise')}
              >
                {activePlan === 'enterprise' ? 'Active Tier' : 'Upgrade to Enterprise'}
              </Button>
            </div>
          </div>
        </div>

        {/* Database & Cloud Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>CockroachDB Multi-Tenant Cluster</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4 text-xs">
              <div className="flex justify-between py-2 border-b border-clinic-100">
                <span className="text-clinic-500">Cluster Name:</span>
                <span className="font-mono font-bold text-clinic-900">synapsemed-za-prod</span>
              </div>
              <div className="flex justify-between py-2 border-b border-clinic-100">
                <span className="text-clinic-500">Tenant Schema:</span>
                <span className="font-mono text-teal-700">tenant_sandton_0428192</span>
              </div>
              <div className="flex justify-between py-2 border-b border-clinic-100">
                <span className="text-clinic-500">Region:</span>
                <span className="font-mono text-clinic-900">eu-central-1 (AWS Frankfurt)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-clinic-100">
                <span className="text-clinic-500">Compliance Protocol:</span>
                <span className="font-semibold text-clinic-900">PostgreSQL Wire v3 + TLS 1.3</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-clinic-500">Cluster Status:</span>
                <span className="px-2 py-0.5 rounded font-bold uppercase bg-emerald-100 text-emerald-800">
                  HEALTHY (8.4ms)
                </span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Render Production Hosting</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4 text-xs">
              <div className="flex justify-between py-2 border-b border-clinic-100">
                <span className="text-clinic-500">Service Name:</span>
                <span className="font-mono font-bold text-clinic-900">synapsemed-za-prod</span>
              </div>
              <div className="flex justify-between py-2 border-b border-clinic-100">
                <span className="text-clinic-500">Service ID:</span>
                <span className="font-mono text-clinic-900">srv-dbmaddjm8hqs73f6kr90</span>
              </div>
              <div className="flex justify-between py-2 border-b border-clinic-100">
                <span className="text-clinic-500">Production URL:</span>
                <a href="https://synapsemed-za-prod.onrender.com" target="_blank" rel="noreferrer" className="text-teal-700 hover:underline font-mono">
                  https://synapsemed-za-prod.onrender.com
                </a>
              </div>
              <div className="flex justify-between py-2 border-b border-clinic-100">
                <span className="text-clinic-500">CI/CD Trigger:</span>
                <span className="font-medium text-clinic-900">Auto Deploy on Git Push to main</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-clinic-500">Live Status:</span>
                <span className="px-2 py-0.5 rounded font-bold uppercase bg-emerald-100 text-emerald-800">
                  LIVE (HTTP 200 OK)
                </span>
              </div>
            </CardBody>
          </Card>
        </div>

      </div>
    </Layout>
  );
}
