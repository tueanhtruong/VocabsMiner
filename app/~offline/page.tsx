export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center text-slate-900">
      <div className="max-w-md">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          VocabMiner
        </p>
        <h1 className="text-3xl font-bold tracking-tight">You&apos;re offline</h1>
        <p className="mt-3 text-slate-600">
          Reconnect to continue extracting and reviewing vocabulary.
        </p>
      </div>
    </main>
  );
}
