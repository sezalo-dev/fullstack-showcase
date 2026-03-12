import { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { fetchListing } from '@/lib/api';
import ImageGallery from '@/components/image-gallery';
import { LocationDisplay } from '@/components/location-display';
import { ContactButton } from '@/components/contact-button';

function parseId(slugId: string = ''): string {
  if (!slugId || slugId.trim() === '') {
    return '';
  }

  // Prüfe ob der gesamte slugId eine UUID ist
  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (uuidPattern.test(slugId)) {
    return slugId;
  }

  // Prüfe ob eine UUID am Ende steht (Format: "title-uuid")
  const uuidAtEnd = slugId.match(
    /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/
  );
  if (uuidAtEnd) {
    return uuidAtEnd[1];
  }

  // Falls keine UUID gefunden wird, gib leeren String zurück
  return '';
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string; slugId: string }> 
}): Promise<Metadata> {
  const { slugId, locale } = await params;
  const t = await getTranslations({ locale });
  const id = parseId(slugId);
  
  if (!id) {
    return {
      title: t('listing.notFound'),
      description: t('listing.notFound')
    };
  }

  const listing = await fetchListing(id);
  return {
    title: listing ? listing.title : t('listing.title'),
    description: listing?.description,
    alternates: {
      canonical: `/anzeige/${slugId}`
    },
    openGraph: {
      title: listing?.title ?? t('listing.title'),
      description: listing?.description ?? ''
    }
  };
}

export default async function ListingDetailPage({ 
  params 
}: { 
  params: Promise<{ locale: string; slugId: string }> 
}) {
  const { slugId, locale } = await params;
  const t = await getTranslations({ locale });
  const id = parseId(slugId);

  if (!id) {
    return (
      <section className="py-12 text-center">
        <div className="card p-12 max-w-md mx-auto">
          <p className="text-xl mb-6" style={{ color: 'var(--text-muted)' }}>{t('listing.invalidUrl')}</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{t('listing.invalidUrlDesc')}</p>
          <Link href="/" className="btn-primary inline-block">
            {t('common.backToHome')}
          </Link>
        </div>
      </section>
    );
  }

  const listing = await fetchListing(id);

  if (!listing) {
    return (
      <section className="py-12 text-center">
        <div className="card p-12 max-w-md mx-auto">
          <p className="text-xl mb-6" style={{ color: 'var(--text-muted)' }}>{t('listing.notFound')}</p>
          <Link href="/" className="btn-primary inline-block">
            {t('common.backToHome')}
          </Link>
        </div>
      </section>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description
  };

  return (
    <section>
      <Link href="/" className="inline-flex items-center mb-8 font-semibold transition-colors" style={{ color: 'var(--primary)' }}>
        ← {t('common.backToSearch')}
      </Link>

      <div className="card p-8 mb-6 shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1>{listing.title}</h1>
          </div>
          <span
            className="inline-block px-4 py-2 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: listing.status === 'active' ? 'var(--accent)' : 'var(--surface-hover)',
              color: 'var(--text)'
            }}
          >
            {t(`listings.status.${listing.status}` as any) || listing.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="mb-6">
              <ImageGallery images={listing.images ?? []} />
            </div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>{t('listing.description')}</h3>
            <p className="leading-relaxed text-base" style={{ color: 'var(--text-muted)' }}>{listing.description}</p>
          </div>

          <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border)', borderWidth: 1, borderStyle: 'solid' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>{t('listing.details')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="font-medium" style={{ color: 'var(--text-muted)' }}>{t('listing.status')}:</span>
                <span className="font-semibold capitalize" style={{ color: 'var(--primary)' }}>{t(`listings.status.${listing.status}` as any) || listing.status}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="font-medium" style={{ color: 'var(--text-muted)' }}>{t('listing.category')}:</span>
                <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{listing.categorySlug || '-'}</span>
              </div>
              {listing.latitude !== undefined && listing.longitude !== undefined && (
                <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="font-medium" style={{ color: 'var(--text-muted)' }}>{t('listing.location')}:</span>
                  <span className="text-sm">
                    <LocationDisplay latitude={listing.latitude} longitude={listing.longitude} />
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-center mb-8">
        <ContactButton listingId={id} />
        <button className="btn-secondary">{t('listing.viewProfile')}</button>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
