'use client';

import { useAuth } from '../lib/auth-context';
import Link from 'next/link';

export function AuthRequiredBanner() {
  const { user, loading } = useAuth();

  if (loading || user) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 py-4 px-4">
      <div className="max-w-[90rem] mx-auto flex items-center justify-between gap-4">
        <p className="text-sm text-blue-900">
          ℹ️ Du musst angemeldet sein um diese Funktion zu nutzen.
        </p>
        <div className="flex gap-2">
          <Link href="/auth/login" className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
            Anmelden
          </Link>
          <Link href="/auth/signup" className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
            Registrieren
          </Link>
        </div>
      </div>
    </div>
  );
}
