import type { MetadataRoute } from 'next';
import { fetchListings, getListingUrl } from '../lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await fetchListings();
  const listingEntries = listings.map((listing) => ({
    url: `${SITE_URL}${getListingUrl(listing)}`,
    lastModified: new Date()
  }));

  return [
    { url: SITE_URL, lastModified: new Date() },
    { url: `${SITE_URL}/suche`, lastModified: new Date() },
    ...listingEntries
  ];
}
