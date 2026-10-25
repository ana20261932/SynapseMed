import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head><title>SynapseMed</title></Head>
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SynapseMed</h1>
          <p className="text-gray-500 text-sm mb-6">South African modular medical practice management</p>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg px-4 py-2 mb-8">
            ⚠️ Development build — synthetic data only. Not for clinical use.
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium">Sign in</Link>
            <Link href="/register" className="border border-gray-300 text-gray-700 rounded-lg px-6 py-3 font-medium">Create account</Link>
          </div>
          <p className="text-xs text-gray-400 mt-6">Demo: demo.owner@synapsemed.local / DemoPass!2024</p>
        </div>
      </main>
    </>
  );
}
