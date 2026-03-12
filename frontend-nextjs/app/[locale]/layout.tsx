import '../globals.css';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '../../i18n/routing';
import { AuthProvider } from '../../lib/auth-context';
import { ProtectedRouteGuard } from '../../components/protected-route-guard';
import { Nav } from '../../components/nav';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t('common.appName')} – Eier, Milch, Weizen, Geflügel`,
    description: 'Plattform für Agrarprodukte: Eier, Milchprodukte, Weizen, Hühner und mehr von regionalen Erzeugern.',
    metadataBase: new URL(SITE_URL),
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: `${t('common.appName')} – Agrarprodukte regional`,
      description: 'Plattform für Agrarprodukte: Eier, Milch, Weizen, Geflügel von regionalen Erzeugern.',
      type: 'website',
      url: SITE_URL
    }
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Set the locale for this request
  setRequestLocale(locale);
  
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <head />
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <ProtectedRouteGuard />
            <Nav />
            <main style={{ minHeight: '100vh' }}>{children}</main>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
