'use client';

import Link from 'next/link';

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section className="py-12 px-4">
      <div className="max-w-xl mx-auto card p-8 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="mb-4">Dashboard konnte nicht geladen werden</h1>
        <p className="text-slate-600 mb-2">
          {error.message || 'Ein Fehler ist beim Laden des Dashboards aufgetreten.'}
        </p>
        <p className="text-slate-500 text-sm mb-6">
          Versuche es erneut oder gehe zurück zur Startseite.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={reset}
            className="btn-secondary"
          >
            Erneut versuchen
          </button>
          <Link href="/" className="btn-primary">
            Zur Startseite
          </Link>
        </div>
      </div>
    </section>
  );
}

