import { getTranslations } from 'next-intl/server';
import { PublicImage } from '@/components/public-image';
import { LocationDisplay } from '@/components/location-display';
import type { Listing } from '@/lib/api';

type ListingCardProps = {
  listing: Listing;
  imagePriority?: boolean;
  /** 'default' = große Karte (z. B. Hauptseite, 3 pro Reihe), 'compact' = kleinere Karte (z. B. Suchseite, 4 pro Reihe, Bild-Logik wie Suchseite) */
  variant?: 'default' | 'compact';
};

export async function ListingCard({
  listing,
  imagePriority = false,
  variant = 'default',
}: ListingCardProps) {
  const t = await getTranslations();
  let categoryLabel: string;
  if (listing.categorySlug) {
    const slug = listing.categorySlug;
    // Alle Kategorien kommen aus der DB und werden über messages.categories.{slug} übersetzt.
    // Falls kein Key existiert, Slug anzeigen (kein Fehler werfen).
    try {
      categoryLabel = t(`categories.${slug}` as any);
    } catch {
      categoryLabel = slug;
    }
  } else {
    categoryLabel = t('home.directMarketing');
  }

  const isCompact = variant === 'compact';
  const hasPrice = typeof listing.price === 'number';
  const priceText = hasPrice ? `${(listing.price as number).toFixed(2)} €` : null;

  return (
    <article
      className={
        isCompact
          ? 'group flex h-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-lg shadow-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl'
          : 'group overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-lg shadow-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#16301d]/10'
      }
    >
      <div className="relative">
        <div
          className={
            isCompact
              ? 'relative w-full overflow-hidden rounded-t-2xl bg-[#f6f4ee] aspect-[4/3]'
              : 'relative h-56 w-full overflow-hidden bg-[#f6f4ee]'
          }
        >
          {listing.images && listing.images.length > 0 ? (
            <PublicImage
              objectKey={listing.images[0]}
              alt={listing.title}
              priority={imagePriority}
              thumbnail
              fill
              className="object-cover"
              sizes={
                isCompact
                  ? '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw'
                  : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
              }
            />
          ) : listing.categorySlug ? (
            <PublicImage
              objectKey={`category-defaults/${listing.categorySlug}.jpg`}
              alt={listing.title}
              priority={imagePriority}
              fill
              className="object-cover"
              sizes={
                isCompact
                  ? '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw'
                  : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
              }
            />
          ) : (
            <div
              className={
                isCompact
                  ? 'flex h-full w-full items-center justify-center text-sm text-slate-400'
                  : 'flex h-full w-full items-center justify-center text-slate-400'
              }
            >
              {isCompact ? (
                <span>{t('listings.noImage')}</span>
              ) : (
                <span className="text-4xl">🌾</span>
              )}
            </div>
          )}
        </div>
        <div
          className={
            isCompact
              ? 'absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-[#2f6b3d] shadow-sm'
              : 'absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#2f6b3d] shadow-sm'
          }
        >
          {categoryLabel}
        </div>
      </div>
      <div className={isCompact ? 'flex flex-1 flex-col p-4' : 'p-6'}>
        <h3
          className={
            isCompact
              ? 'text-base font-semibold leading-snug tracking-tight text-[#16301d] md:text-lg'
              : 'text-2xl font-bold leading-snug tracking-tight text-[#16301d]'
          }
        >
          {listing.title}
        </h3>
        <div className={`flex items-center gap-2 text-sm text-slate-500 ${isCompact ? 'mt-2' : 'mt-4'}`}>
          {listing.latitude !== undefined && listing.longitude !== undefined ? (
            <LocationDisplay
              latitude={listing.latitude}
              longitude={listing.longitude}
              className="text-xs"
            />
          ) : (
            <span className="text-xs">–</span>
          )}
        </div>
        <p
          className={
            isCompact
              ? 'mt-2 line-clamp-2 flex-1 text-sm leading-5 text-slate-600'
              : 'mt-3 line-clamp-2 text-sm leading-6 text-slate-600'
          }
        >
          {listing.description}
        </p>
        <div
          className={
            isCompact
              ? 'mt-4 flex items-center justify-between border-t border-slate-100 pt-3'
              : 'mt-6 flex items-center justify-between border-t border-slate-100 pt-5'
          }
        >
          <span className="text-sm font-semibold text-[#16301d]">
            {hasPrice ? priceText : '\u00A0'}
          </span>
          <span className="rounded-full bg-[#f2f7f2] px-3 py-1.5 text-xs font-semibold text-[#2f6b3d] transition group-hover:bg-[#2f6b3d] group-hover:text-white">
            {t('home.viewDetails')}
          </span>
        </div>
      </div>
    </article>
  );
}
