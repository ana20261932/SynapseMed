import Link from 'next/link';
import Head from 'next/head';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>SynapseMed — South African Practice Management & Medical-Aid Billing</title>
        <meta name="description" content="SynapseMed is a modular South African medical practice management platform — patient records, scheduling, clinical notes, and medical-aid switch billing for pharmacies and practices." />
      </Head>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur border-b border-clinic-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-synapse-600 rounded-xl flex items-center justify-center text-white text-lg">S</div>
              <span className="font-bold text-xl text-clinic-900 tracking-tight">SynapseMed</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-clinic-600">
              <Link href="/#features" className="hover:text-synapse-600 transition-colors">Features</Link>
              <Link href="/#benefits" className="hover:text-synapse-600 transition-colors">Benefits</Link>
              <Link href="/#pharmacy" className="hover:text-synapse-600 transition-colors">Pharmacy</Link>
              <Link href="/#pricing" className="hover:text-synapse-600 transition-colors">Pricing</Link>
              <a href="/register" className="bg-synapse-600 hover:bg-synapse-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors">Get started</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-synapse-50 text-synapse-700 text-xs font-medium border border-synapse-100 mb-6">
              South African practice management
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-clinic-900 tracking-tight mb-6 leading-tight">
              Run your practice. <br />
              <span className="text-synapse-600">Bill medical aid with confidence.</span>
            </h1>
            <p className="text-lg text-clinic-600 mb-8 max-w-xl mx-auto leading-relaxed">
              Patient records, scheduling, clinical notes, and medical-aid switch billing — built for South African GPs, pharmacies, and multi-discipline practices. Mock switch by default; go live when your contract is approved.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-synapse-600 hover:bg-synapse-700 text-white px-8 py-4 rounded-xl text-lg font-medium transition-colors shadow-medical">
                Create your practice account
              </Link>
              <Link href="/login" className="bg-white border border-clinic-200 hover:bg-clinic-50 text-clinic-700 px-8 py-4 rounded-xl text-lg font-medium transition-colors">
                Sign in
              </Link>
            </div>
            <p className="text-xs text-clinic-400 mt-8 max-w-xl mx-auto">
              ⚠️ Development environment — synthetic data only. Not for clinical use. All medical-aid claims simulated until a live switch contract is approved.
            </p>
          </div>

          {/* Doctor illustration */}
          <div className="mt-16 relative">
            <div className="absolute -inset-1 bg-synapse-100 rounded-2xl blur-3xl"></div>
            <div className="relative rounded-2xl overflow-hidden border border-clinic-200 bg-clinic-50 shadow-card">
              <div className="aspect-video bg-gradient-to-br from-synapse-100 to-clinic-100 flex items-center justify-center">
                <svg className="w-1/2 h-1/2 text-synapse-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-clinic-900 mb-2">Female doctor — tablet + laptop</h3>
                <p className="text-sm text-clinic-500">Illustration placeholder showing SynapseMed on tablet and laptop for practice workflow.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section id="pain-points" className="py-16 bg-clinic-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-clinic-900 mb-4">The problems South African practices face</h2>
            <p className="text-clinic-600 max-w-2xl mx-auto">Disconnected records, slow medical-aid claims, manual inventory, and no visibility into switch billing.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[{
              title: 'Claims stuck in limbo',
              desc: 'Medical-aid submissions take days. No real-time adjudication status. Patients left unsure of co-payments.'
            }, {
              title: 'Inventory guesswork',
              desc: 'Pharmacy stock tracked on paper or spreadsheets. NAPPI codes missing. Low-stock alerts missed.'
            }, {
              title: 'Practice admin overload',
              desc: 'Appointments, notes, and billing in separate systems. No unified dashboard for the practice owner.'
            }].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-clinic-200">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-clinic-900 mb-2">{item.title}</h4>
                <p className="text-sm text-clinic-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features / Benefits */}
      <section id="features" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-clinic-900 mb-4">Everything your practice needs</h2>
            <p className="text-clinic-600 max-w-2xl mx-auto">One platform for patient care, scheduling, clinical notes, inventory, and switch billing.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[{
              icon: '📋',
              title: 'Patient & appointment records',
              desc: 'Demographics, medical aid, appointments, and clinical notes in one patient timeline.'
            }, {
              icon: '💊',
              title: 'Pharmacy + NAPPI billing',
              desc: 'Dispense medicine on medical aid. Claims submitted through the switch adapter with stock deduction.'
            }, {
              icon: '🧾',
              title: 'Medical-aid switch billing',
              desc: 'Submit claims, check status, and reverse. Separate switch ledger from PMS subscription.'
            }, {
              icon: '🤖',
              title: 'AI automation (draft only)',
              desc: 'Draft notes, task reminders, and doctor-setup checklists — always requiring human review.'
            }, {
              icon: '📦',
              title: 'Inventory & stock movements',
              desc: 'Track quantity, batch/expiry, NAPPI codes, and low-stock alerts per item.'
            }, {
              icon: '🔐',
              title: 'SA-compliant by design',
              desc: 'Tenant isolation, RBAC, audit events, and POPIA-aligned data handling.'
            }].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-clinic-200 hover:shadow-card-hover transition-shadow group">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h4 className="font-semibold text-clinic-900 mb-2">{item.title}</h4>
                <p className="text-sm text-clinic-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pharmacy spotlight */}
      <section id="pharmacy" className="py-16 bg-clinic-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-clinic-900 mb-4">Built for South African pharmacies</h2>
              <p className="text-clinic-600 mb-6">Buy medicine with medical aid using the switch API. NAPPI-coded inventory, real-time adjudication, and automatic stock deduction.</p>
              <ul className="space-y-3 text-clinic-600 text-sm mb-8">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-synapse-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  Submit NAPPI claims through the SA medical-aid switch
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-synapse-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  Patient-liable and approved amounts shown per line
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-synapse-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  Stock deducted automatically on accepted/partial claims
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-synapse-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  Separate switch invoices from PMS subscription
                </li>
              </ul>
              <Link href="/register" className="inline-block bg-synapse-600 hover:bg-synapse-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                Open a pharmacy account
              </Link>
            </div>
            <div className="relative">
              <div className="absolute -inset-1 bg-synapse-200 rounded-2xl blur"></div>
              <div className="relative rounded-2xl overflow-hidden border border-clinic-200 bg-white shadow-card">
                <div className="aspect-square bg-synapse-50 flex items-center justify-center">
                  <svg className="w-1/2 h-1/2 text-synapse-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-clinic-900 mb-2">Pharmacy dashboard</h3>
                  <p className="text-sm text-clinic-500">Inventory table with NAPPI codes, low-stock alerts, and dispense-on-medical-aid modal.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-synapse-900 rounded-3xl p-8 sm:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to run your practice on SynapseMed?</h2>
            <p className="text-synapse-100 mb-8 max-w-lg mx-auto">Start with mock data and a simulated switch. Go live when your medical-aid contract is approved.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-white text-synapse-900 hover:bg-clinic-50 px-8 py-4 rounded-xl font-semibold transition-colors">
                Create free account
              </Link>
              <Link href="/login" className="border border-synapse-200 text-synapse-200 hover:bg-synapse-800 px-8 py-4 rounded-xl font-semibold transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-clinic-200 bg-clinic-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-clinic-500">
            SynapseMed — South African modular medical practice management. Synthetic data only. Not for clinical use.
          </div>
          <div className="flex gap-4 text-sm text-clinic-500">
            <Link href="/#features" className="hover:text-synapse-600">Features</Link>
            <Link href="/#pharmacy" className="hover:text-synapse-600">Pharmacy</Link>
            <Link href="/login" className="hover:text-synapse-600">Sign in</Link>
            <Link href="/register" className="hover:text-synapse-600">Register</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
