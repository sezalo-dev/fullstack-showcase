import { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import {
  fetchSearchListingsWithTotal,
  fetchCategoryTree,
  getListingUrl,
  type SearchParams,
  type CategoryNode,
} from '@/lib/api';
import { SearchForm } from '@/components/search-form';
import { ListingCard } from '@/components/listing-card';
import { Paginator } from '@/components/paginator';

export const revalidate = 60;

type CategoryTreeNode = Omit<CategoryNode, 'children'> & {
  children: CategoryTreeNode[];
  aggregateCount: number;
};

type CategoryTreeItemProps = {
  node: CategoryTreeNode;
  selectedCategory: string;
  buildPageHref: (page: number, size?: number, overrides?: { category?: string | null }) => string;
  t: (key: string) => string;
};

function CategoryTreeItem({
  node,
  selectedCategory,
  buildPageHref,
  t,
}: CategoryTreeItemProps) {
  return (
    <li>
      <Link
        href={buildPageHref(0, undefined, { category: node.slug })}
        className={`flex items-center justify-between rounded px-2 py-1 ${
          selectedCategory === node.slug ? 'bg-[var(--bg-subtle)] font-medium' : ''
        }`}
      >
        <span>{node.translationKey ? t(node.translationKey as any) : node.slug}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {node.aggregateCount}
        </span>
      </Link>
      {node.children.length > 0 && (
        <ul className="mt-1 space-y-1 border-l pl-3">
          {node.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              selectedCategory={selectedCategory}
              buildPageHref={buildPageHref}
              t={t}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function buildCategoryTreeWithCounts(
  roots: CategoryNode[],
  facets: { categories: { slug: string; count: number }[] },
): CategoryTreeNode[] {
  const countBySlug = new Map<string, number>();
  for (const f of facets.categories) {
    countBySlug.set(f.slug, f.count);
  }

  function cloneWithCounts(node: CategoryNode): CategoryTreeNode | null {
    const children: CategoryTreeNode[] = [];
    for (const child of node.children ?? []) {
      const cloned = cloneWithCounts(child);
      if (cloned && cloned.aggregateCount > 0) {
        children.push(cloned);
      }
    }

    const own = countBySlug.get(node.slug) ?? 0;
    const sumChildren = children.reduce((sum, c) => sum + c.aggregateCount, 0);
    const total = own + sumChildren;

    if (total === 0) {
      return null;
    }

    return {
      ...node,
      children,
      aggregateCount: total,
    };
  }

  const result: CategoryTreeNode[] = [];
  for (const root of roots) {
    const cloned = cloneWithCounts(root);
    if (cloned && cloned.aggregateCount > 0) {
      result.push(cloned);
    }
  }
  return result;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; location?: string; page?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { q = '', location = '' } = await searchParams;
  const t = await getTranslations({ locale });

  const searchTerm = q || location || '';

  return {
    title: searchTerm ? `${t('search.title')}: ${searchTerm}` : t('search.title'),
    robots: searchTerm.length > 80 ? { index: false, follow: false } : { index: true, follow: true },
    alternates: {
      canonical: searchTerm ? `/suche?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}` : '/suche',
    },
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    latitude?: string;
    longitude?: string;
    radiusKm?: string;
    location?: string;
    page?: string;
    size?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    shipping?: string;
    sellerType?: string;
    listingType?: string;
  }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const resolvedParams = await searchParams;
  
  const currentPage = resolvedParams.page ? Math.max(0, Number.parseInt(resolvedParams.page) || 0) : 0;
  const requestedSize = resolvedParams.size ? Number.parseInt(resolvedParams.size) || 12 : 12;
  const pageSize = Math.min(Math.max(requestedSize, 6), 48);

  const searchParamsObj: SearchParams = { page: currentPage, size: pageSize };
  if (resolvedParams.q) {
    searchParamsObj.q = resolvedParams.q;
  }
  if (resolvedParams.latitude && resolvedParams.longitude) {
    searchParamsObj.latitude = parseFloat(resolvedParams.latitude);
    searchParamsObj.longitude = parseFloat(resolvedParams.longitude);
    searchParamsObj.radiusKm = resolvedParams.radiusKm ? parseFloat(resolvedParams.radiusKm) : 10;
  }
  if (resolvedParams.category) {
    searchParamsObj.categorySlug = resolvedParams.category;
  }
  if (resolvedParams.minPrice) {
    const value = Number.parseFloat(resolvedParams.minPrice);
    if (!Number.isNaN(value)) {
      searchParamsObj.minPrice = value;
    }
  }
  if (resolvedParams.maxPrice) {
    const value = Number.parseFloat(resolvedParams.maxPrice);
    if (!Number.isNaN(value)) {
      searchParamsObj.maxPrice = value;
    }
  }
  if (resolvedParams.shipping === 'true') {
    searchParamsObj.shipping = true;
  } else if (resolvedParams.shipping === 'false') {
    searchParamsObj.shipping = false;
  }
  if (resolvedParams.sellerType) {
    searchParamsObj.sellerType = resolvedParams.sellerType;
  }
  if (resolvedParams.listingType) {
    searchParamsObj.listingType = resolvedParams.listingType;
  }

  const [{ listings: filtered, total, facets }, categoryNodes] = await Promise.all([
    fetchSearchListingsWithTotal(searchParamsObj),
    fetchCategoryTree(),
  ]);

  const hasSearchCriteria = resolvedParams.q || (resolvedParams.latitude && resolvedParams.longitude);

  const searchTerm = resolvedParams.q ?? '';
  const searchLocation = resolvedParams.location ?? '';
  const selectedCategory = resolvedParams.category ?? '';
  const selectedShipping = resolvedParams.shipping ?? '';
  const selectedSellerType = resolvedParams.sellerType ?? '';
  const selectedListingType = resolvedParams.listingType ?? '';
  const startIndex = total === 0 ? 0 : currentPage * pageSize + 1;
  const endIndex = total === 0 ? 0 : Math.min(total, (currentPage + 1) * pageSize);

  const buildPageHref = (
    page: number,
    size: number = pageSize,
    overrides?: {
      category?: string | null;
      shipping?: string | null;
      sellerType?: string | null;
      listingType?: string | null;
      minPrice?: number | null;
      maxPrice?: number | null;
    },
  ) => {
    const params = new URLSearchParams();
    if (resolvedParams.q) params.set('q', resolvedParams.q);
    if (resolvedParams.location) params.set('location', resolvedParams.location);
    if (resolvedParams.latitude) params.set('latitude', resolvedParams.latitude);
    if (resolvedParams.longitude) params.set('longitude', resolvedParams.longitude);
    if (resolvedParams.radiusKm) params.set('radiusKm', resolvedParams.radiusKm);
    if (page > 0) params.set('page', page.toString());
    if (size !== 12) params.set('size', size.toString());

    const categoryToUse =
      overrides?.category === null ? undefined : overrides?.category ?? resolvedParams.category;
    if (categoryToUse) params.set('category', categoryToUse);

    const shippingToUse =
      overrides?.shipping === null ? undefined : overrides?.shipping ?? resolvedParams.shipping;
    if (shippingToUse) params.set('shipping', shippingToUse);

    const sellerTypeToUse =
      overrides?.sellerType === null ? undefined : overrides?.sellerType ?? resolvedParams.sellerType;
    if (sellerTypeToUse) params.set('sellerType', sellerTypeToUse);

    const listingTypeToUse =
      overrides?.listingType === null ? undefined : overrides?.listingType ?? resolvedParams.listingType;
    if (listingTypeToUse) params.set('listingType', listingTypeToUse);

    const minPriceToUse =
      overrides?.minPrice === null ? undefined : overrides?.minPrice ?? searchParamsObj.minPrice;
    if (typeof minPriceToUse === 'number') params.set('minPrice', String(minPriceToUse));

    const maxPriceToUse =
      overrides?.maxPrice === null ? undefined : overrides?.maxPrice ?? searchParamsObj.maxPrice;
    if (typeof maxPriceToUse === 'number') params.set('maxPrice', String(maxPriceToUse));

    const query = params.toString();
    return query ? `/suche?${query}` : '/suche';
  };

  const categoryTree = buildCategoryTreeWithCounts(categoryNodes, facets);

  return (
    <section>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filter */}
        <aside className="order-last lg:order-first lg:col-span-1">
          <div className="space-y-4 sticky top-24">
            {/* Produktsuche */}
            <div className="card p-4">
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
                Produktsuche
              </h2>
              <SearchForm />
            </div>

            {/* Kategorien (hierarchisch, aufklappbar) */}
            <div className="card p-4">
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
                {t('search.categoryFilterTitle')}
              </h2>
              {categoryTree.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Keine Kategorien vorhanden.
                </p>
              ) : (
                <div className="space-y-1 text-sm">
                  <Link
                    href={buildPageHref(0, pageSize, { category: null })}
                    className={`flex items-center justify-between rounded px-2 py-1 ${
                      !selectedCategory ? 'bg-[var(--bg-subtle)] font-medium' : ''
                    }`}
                  >
                    <span>{t('categories.all')}</span>
                  </Link>

                  <div className="mt-2 space-y-1">
                    {categoryTree.map((root) => (
                      <details key={root.id} className="group rounded-md">
                        <summary className="flex cursor-pointer items-center justify-between rounded px-2 py-1 text-sm hover:bg-[var(--bg-subtle)]">
                          <span className="font-medium">
                            {t(root.translationKey as any)}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {root.aggregateCount}
                          </span>
                        </summary>
                        {root.children.length > 0 && (
                          <ul className="mt-1 space-y-1 border-l pl-3">
                            {root.children.map((child) => (
                              <CategoryTreeItem
                                key={child.id}
                                node={child}
                                selectedCategory={selectedCategory}
                                buildPageHref={buildPageHref}
                                t={t}
                              />
                            ))}
                          </ul>
                        )}
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Preis */}
            <div className="card p-4">
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
                {t('search.priceFilterTitle')}
              </h2>
              {facets.price.min == null || facets.price.max == null ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t('search.priceNoInfo')}
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t('search.priceFrom')}
                    </span>
                    <span className="text-sm">
                      {facets.price.min.toFixed(2)} €{/* nur Anzeige, Änderung über Schnellfilter */}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t('search.priceTo')}
                    </span>
                    <span className="text-sm">
                      {facets.price.max.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {[10, 25, 50, 100].map((step) => (
                      <Link
                        key={step}
                        href={buildPageHref(0, pageSize, {
                          minPrice: facets.price.min,
                          maxPrice: facets.price.min! + step,
                        })}
                        className="px-2 py-1 rounded-full border text-xs"
                      >
                        {t('search.priceUpTo', { value: (facets.price.min! + step).toFixed(0) })}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Versand */}
            <div className="card p-4">
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
                {t('search.shippingFilterTitle')}
              </h2>
              <div className="flex flex-col gap-1 text-sm">
                <Link
                  href={buildPageHref(0, pageSize, { shipping: null })}
                  className={`flex items-center justify-between rounded px-2 py-1 ${
                    !selectedShipping ? 'bg-[var(--bg-subtle)] font-medium' : ''
                  }`}
                >
                  <span>{t('search.allFilter')}</span>
                </Link>
                {facets.shipping.map((option) => (
                  <Link
                    key={option.value ? 'yes' : 'no'}
                    href={buildPageHref(0, pageSize, { shipping: option.value ? 'true' : 'false' })}
                    className={`flex items-center justify-between rounded px-2 py-1 ${
                      selectedShipping === (option.value ? 'true' : 'false')
                        ? 'bg-[var(--bg-subtle)] font-medium'
                        : ''
                    }`}
                  >
                    <span>{option.value ? t('search.shippingWith') : t('search.shippingPickup')}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {option.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Verkäufer */}
            <div className="card p-4">
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
                {t('search.sellerFilterTitle')}
              </h2>
              <div className="flex flex-col gap-1 text-sm">
                <Link
                  href={buildPageHref(0, pageSize, { sellerType: null })}
                  className={`flex items-center justify-between rounded px-2 py-1 ${
                    !selectedSellerType ? 'bg-[var(--bg-subtle)] font-medium' : ''
                  }`}
                >
                  <span>{t('search.allFilter')}</span>
                </Link>
                {facets.sellerType.map((option) => (
                  <Link
                    key={option.value}
                    href={buildPageHref(0, pageSize, { sellerType: option.value })}
                    className={`flex items-center justify-between rounded px-2 py-1 ${
                      selectedSellerType === option.value ? 'bg-[var(--bg-subtle)] font-medium' : ''
                    }`}
                  >
                    <span>
                      {option.value === 'privateSeller'
                        ? t('search.sellerPrivate')
                        : option.value === 'business'
                        ? t('search.sellerBusiness')
                        : option.value}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {option.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Anzeigentyp */}
            <div className="card p-4">
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
                {t('search.listingTypeFilterTitle')}
              </h2>
              <div className="flex flex-col gap-1 text-sm">
                <Link
                  href={buildPageHref(0, pageSize, { listingType: null })}
                  className={`flex items-center justify-between rounded px-2 py-1 ${
                    !selectedListingType ? 'bg-[var(--bg-subtle)] font-medium' : ''
                  }`}
                >
                  <span>{t('search.allFilter')}</span>
                </Link>
                {facets.listingType.map((option) => (
                  <Link
                    key={option.value}
                    href={buildPageHref(0, pageSize, { listingType: option.value })}
                    className={`flex items-center justify-between rounded px-2 py-1 ${
                      selectedListingType === option.value ? 'bg-[var(--bg-subtle)] font-medium' : ''
                    }`}
                  >
                    <span>
                      {option.value === 'offer'
                        ? t('search.listingTypeOffer')
                        : option.value === 'search'
                        ? t('search.listingTypeSearch')
                        : option.value}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {option.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Ergebnisliste + Paginator */}
        <div className="lg:col-span-3">
          {filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-xl mb-6" style={{ color: 'var(--text-muted)' }}>
                {hasSearchCriteria ? t('search.noResults') : t('search.noResultsYet')}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {t('search.adjustFilters')}
              </p>
            </div>
          ) : (
            <>
              <p className="mb-6 font-medium" style={{ color: 'var(--text-muted)' }}>
                {startIndex} - {endIndex} von {total} Ergebnissen
                {searchTerm && (
                  <>
                    {' '}
                    für „{searchTerm}“
                  </>
                )}
                {searchLocation && (
                  <>
                    {' '}
                    in „{searchLocation}“
                  </>
                )}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((listing, index) => (
                  <Link href={getListingUrl(listing)} key={listing.id} className="h-full">
                    <ListingCard
                      listing={listing}
                      imagePriority={index < 3}
                      variant="compact"
                    />
                  </Link>
                ))}
              </div>

              <Paginator
                currentPage={currentPage}
                total={total}
                pageSize={pageSize}
                buildPageHref={buildPageHref}
                showPageSizeControls
                pageSizeOptions={[6, 12, 24, 48]}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
