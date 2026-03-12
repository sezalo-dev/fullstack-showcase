'use client';

import { Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { HeaderSearch } from '@/components/header-search';
import LanguageSwitcher from '@/components/language-switcher';
import UserNav from '@/components/user-nav';

export function Nav() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-[#faf8f3]/90 backdrop-blur">
      <div className="mx-auto flex max-w-[90rem] items-center justify-between px-6 py-4 lg:px-8">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2f6b3d] text-lg text-white shadow-sm">
              🌾
            </Link>
            <div>
              <Link href="/" className="text-lg font-bold tracking-tight text-[#16301d] hover:text-[#16301d]">
                {t('common.appName')}
              </Link>
              <div className="text-xs text-slate-500">{t('common.tagline')}</div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <Link href="/" className="text-[#16301d] hover:text-[#16301d]">
              {t('common.start')}
            </Link>
            <Link href="/suche" className="hover:text-[#2f6b3d]">
              {t('common.navOffers')}
            </Link>
            <Link href="/#so-funktionierts" className="hover:text-[#2f6b3d]">
              {t('common.navHowItWorks')}
            </Link>
            <Link href="/#anbieter" className="hover:text-[#2f6b3d]">
              {t('common.navForProviders')}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block w-[230px]">
            <Suspense fallback={<div className="w-full h-10" />}>
              <HeaderSearch />
            </Suspense>
          </div>
          <div className="md:hidden">
            <Suspense fallback={<div className="w-10 h-10" />}>
              <HeaderSearch />
            </Suspense>
          </div>
          <LanguageSwitcher currentLocale={locale} />
          <Link
            href="/dashboard"
            className="rounded-full bg-[#2f6b3d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#265a32]"
          >
            {t('common.createListing')}
          </Link>
          <div className="flex items-center min-w-[120px] justify-end" style={{ minHeight: '40px' }}>
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  );
}
