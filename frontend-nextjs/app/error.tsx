'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

const translations = {
  de: {
    title: 'Etwas ist schiefgelaufen',
    fallbackMessage: 'Ein unerwarteter Fehler ist aufgetreten.',
    description: 'Du kannst es noch einmal versuchen oder zur Startseite zurückkehren.',
    retry: 'Noch einmal versuchen',
    home: 'Zur Startseite',
  },
  en: {
    title: 'Something went wrong',
    fallbackMessage: 'An unexpected error occurred.',
    description: 'You can try again or go back to the home page.',
    retry: 'Try again',
    home: 'Go to home page',
  },
} as const;

type SupportedLocale = keyof typeof translations;

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  const params = useParams();
  const locale = (typeof params?.locale === 'string' && params.locale in translations
    ? params.locale
    : 'de') as SupportedLocale;
  const t = translations[locale];

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="max-w-lg w-full card p-8 text-center">
        <h1 className="mb-4">{t.title}</h1>
        <p className="text-slate-600 mb-2">
          {error.message || t.fallbackMessage}
        </p>
        <p className="text-slate-500 text-sm mb-6">
          {t.description}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={reset}
            className="btn-secondary"
          >
            {t.retry}
          </button>
          <Link href={`/${locale}`} className="btn-primary">
            {t.home}
          </Link>
        </div>
      </div>
    </div>
  );
}

