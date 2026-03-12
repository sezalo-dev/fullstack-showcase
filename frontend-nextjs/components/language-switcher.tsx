'use client';

import { useRef, useEffect, useState } from 'react';
import { usePathname, useRouter } from '../i18n/navigation';
import { locales, type Locale } from '../i18n/routing';

const localeNames: Record<Locale, string> = {
  de: 'DE',
  en: 'EN',
  fr: 'FR',
};

export default function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const switchLanguage = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const current = (currentLocale?.toLowerCase() || 'de') as Locale;
  const isLocale = (l: string): l is Locale => locales.includes(l as Locale);

  return (
    <div className="relative inline-block w-14" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-full border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Sprache wählen"
      >
        {localeNames[isLocale(current) ? current : 'de']}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
          role="menu"
        >
          {locales.map((locale) => {
            const selected = current === locale;
            return (
              <button
                key={locale}
                type="button"
                role="menuitem"
                onClick={() => switchLanguage(locale)}
                className={`w-full py-2 text-center text-sm font-medium transition first:rounded-t-2xl last:rounded-b-2xl ${
                  selected
                    ? 'bg-[#2f6b3d] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {localeNames[locale]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
