import Image from 'next/image';
import { Link } from '../../i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { fetchListings, fetchCategoryTree, getListingUrl } from '../../lib/api';
import type { CategoryNode } from '../../lib/api';
import { ListingCard } from '../../components/listing-card';
import { Paginator } from '../../components/paginator';

export const revalidate = 60;

const HERO_IMAGE = '/storage/v1/object/public/media/category-defaults/agriConsulting.jpg';

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const currentPage = page ? Math.max(0, Number.parseInt(page) || 0) : 0;
  const pageSize = 12;

  const [listings, categoryTree] = await Promise.all([
    fetchListings(currentPage, pageSize),
    fetchCategoryTree(),
  ]);
  const categories: CategoryNode[] = categoryTree.filter((c) => !c.parentId);
  const hasNextPage = listings.length === pageSize;

  return (
    <div className="min-h-screen bg-[#faf8f3] text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(47,107,61,0.16),_transparent_32%),radial-gradient(circle_at_right,_rgba(232,204,147,0.22),_transparent_24%)]" />
        <div className="mx-auto grid max-w-[90rem] items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center rounded-full border border-[#dbe7dc] bg-white/80 px-4 py-2 text-sm font-medium text-[#2f6b3d] shadow-sm">
              {t('home.heroBadge')}
            </div>
            <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-[#16301d] md:text-6xl">
              {t('home.title').replace(t('home.titleHighlight'), '').trim()}{' '}
              <span className="text-[#2f6b3d]">{t('home.titleHighlight')}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              {t('home.description')}
            </p>

            <form
              action={`/${locale}/suche`}
              method="get"
              className="mt-8 rounded-3xl border border-[#e7e2d7] bg-white p-3 shadow-lg shadow-black/5"
            >
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  name="q"
                  className="h-14 flex-1 rounded-2xl border border-transparent bg-[#f6f4ee] px-5 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-[#c7d9ca]"
                  placeholder={t('home.searchPlaceholder')}
                />
                <button
                  type="submit"
                  className="h-14 rounded-2xl bg-[#2f6b3d] px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  {t('home.discoverOffers')}
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              {[
                t('home.tagRegional'),
                t('home.tagDirect'),
                t('home.tagSustainable'),
                t('home.tagFair'),
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#d9e6db] bg-[#f4f8f4] px-4 py-2 font-medium text-[#2f6b3d]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white p-3 shadow-2xl shadow-[#16301d]/10">
              <Image
                src={HERO_IMAGE}
                alt="Landwirtschaftliche Felder bei Sonnenuntergang"
                width={800}
                height={480}
                className="h-[480px] w-full rounded-[24px] object-cover"
                priority
                unoptimized
              />
              <div className="absolute bottom-8 left-8 right-8 rounded-3xl bg-white/92 p-5 shadow-xl backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2f6b3d]">
                      {t('home.trendingLabel')}
                    </div>
                    <div className="mt-2 text-xl font-bold text-[#16301d]">
                      {t('home.trendingTitle')}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#edf5ee] px-3 py-2 text-sm font-semibold text-[#2f6b3d]">
                    {t('home.trendingCount', { count: 120 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Aktuelle Angebote */}
      <section id="angebote" className="mx-auto max-w-[90rem] px-6 py-12 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2f6b3d]">
              {t('home.currentOffers')}
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#16301d] md:text-4xl">
              {t('home.offersFromRegion')}
            </h2>
          </div>
          <p className="max-w-xl text-slate-600">{t('home.offersSectionDesc')}</p>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-[28px] border border-black/5 bg-white p-12 text-center shadow-lg">
            <p className="text-lg text-slate-600">{t('home.noOffers')}</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block rounded-full bg-[#2f6b3d] px-6 py-3 text-sm font-semibold text-white"
            >
              {t('home.createListingButton')}
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing, index) => (
                <Link href={getListingUrl(listing)} key={listing.id}>
                  <ListingCard listing={listing} imagePriority={index < 3} />
                </Link>
              ))}
            </div>
            <div className="mt-8">
              <Paginator
                currentPage={currentPage}
                total={(currentPage + (hasNextPage ? 2 : 1)) * pageSize}
                pageSize={pageSize}
                buildPageHref={(pageIndex) =>
                  pageIndex > 0 ? `/?page=${pageIndex}` : '/'
                }
              />
            </div>
          </>
        )}
      </section>

      {/* So funktioniert's */}
      <section id="so-funktionierts" className="mx-auto max-w-[90rem] px-6 py-12 lg:px-8">
        <div className="rounded-[36px] border border-[#2f6b3d]/40 bg-[#16301d] px-8 py-10 text-white shadow-lg md:px-12 md:py-14">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b8d5bf]">
              {t('home.howItWorksLabel')}
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
              {t('home.howItWorksTitle')}
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              [t('home.howStep1Title'), t('home.howStep1Text')],
              [t('home.howStep2Title'), t('home.howStep2Text')],
              [t('home.howStep3Title'), t('home.howStep3Text')],
            ].map(([title, text], i) => (
              <div
                key={i}
                className="rounded-[28px] border border-white/20 bg-[#2f6b3d]/30 p-6 backdrop-blur"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b8d5bf] text-lg font-bold text-[#16301d]">
                  {i + 1}
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-100">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Warum Op de Markt */}
      <section className="mx-auto max-w-[90rem] px-6 py-12 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2f6b3d]">
            {t('home.whyLabel')}
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#16301d] md:text-4xl">
            {t('home.whyTitle')}
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            [t('home.why1Title'), t('home.why1Text')],
            [t('home.why2Title'), t('home.why2Text')],
            [t('home.why3Title'), t('home.why3Text')],
          ].map(([title, text], i) => (
            <div
              key={i}
              className="rounded-[28px] border border-[#ece8de] bg-white p-7 shadow-sm"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf5ee] text-xl">
                ✓
              </div>
              <h3 className="text-xl font-bold text-[#16301d]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Für Anbieter */}
      <section id="anbieter" className="mx-auto max-w-[90rem] px-6 pb-20 pt-8 lg:px-8">
        <div className="rounded-[36px] border border-[#dbe7dc] bg-gradient-to-br from-[#f4f8f4] to-[#fffaf0] px-8 py-10 md:flex md:items-center md:justify-between md:px-12 md:py-14">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2f6b3d]">
              {t('home.forProvidersLabel')}
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#16301d] md:text-4xl">
              {t('home.forProvidersTitle')}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {t('home.forProvidersDesc')}
            </p>
          </div>
          <div className="mt-6 flex gap-3 md:mt-0">
            <Link
              href="/dashboard"
              className="rounded-2xl bg-[#2f6b3d] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5"
            >
              {t('home.forProvidersCta')}
            </Link>
            <Link
              href="/suche"
              className="rounded-2xl border border-[#d0d7cf] bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t('home.forProvidersMore')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
