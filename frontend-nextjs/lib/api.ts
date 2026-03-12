export type Listing = {
  id: string;
  title: string;
  description: string;
  categorySlug: string;
  status: string;
  price?: number;
  shipping?: boolean;
  sellerType?: string;
  listingType?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  // optional image URLs (full-size). First image is used as thumbnail if present.
  images?: string[];
  // optional coordinates for location
  latitude?: number;
  longitude?: number;
};

export type CategoryNode = {
  id: string;
  slug: string;
  translationKey: string;
  parentId?: string | null;
  sortOrder: number;
  children?: CategoryNode[];
};

/**
 * Generiert eine SEO-freundliche URL für eine Anzeige.
 * Format: /anzeige/{title-slug}-{uuid}
 */
export function getListingUrl(listing: Listing): string {
  // Erstelle einen URL-freundlichen Slug aus dem Titel
  const titleSlug = listing.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50); // Maximal 50 Zeichen für den Titel-Teil

  return `/anzeige/${titleSlug}-${listing.id}`;
}

// Use internal gateway URL on the server (SSR in Docker), but same-origin in browser.
const API_BASE =
  typeof window === 'undefined'
    ? (process.env.API_BASE_INTERNAL ?? process.env.NEXT_PUBLIC_API_BASE ?? 'http://gateway-service:8080')
    : (process.env.NEXT_PUBLIC_API_BASE ?? '');

const isDev = process.env.NODE_ENV === 'development';
const DEFAULT_TIMEOUT_MS = 15_000;

function fetchWithTimeout(url: string, options?: RequestInit & { timeoutMs?: number }): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options ?? {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...fetchOptions, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
}

function devError(...args: unknown[]) {
  if (isDev) {
    console.error(...args);
  }
}

function devWarn(...args: unknown[]) {
  if (isDev) {
    console.warn(...args);
  }
}

async function safeJson<T>(res: Response, context: string, fallback: T): Promise<T> {
  if (!res.ok) {
    devError(
      `[api] ${context} failed`,
      { status: res.status, statusText: res.statusText, url: res.url }
    );
    return fallback;
  }

  try {
    return (await res.json()) as T;
  } catch (error) {
    devError(`[api] ${context} JSON parse error`, error);
    return fallback;
  }
}

export async function fetchListings(page = 0, size = 12): Promise<Listing[]> {
  try {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('size', size.toString());
    const res = await fetch(`${API_BASE}/api/v1/public/listings?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    return safeJson<Listing[]>(res, 'fetchListings', []);
  } catch (error) {
    devError('[api] fetchListings error', error);
    return [];
  }
}

export async function fetchCategoryTree(): Promise<CategoryNode[]> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/v1/public/categories`);
    if (!res.ok) {
      devError('[api] fetchCategoryTree failed', {
        status: res.status,
        statusText: res.statusText,
        url: res.url,
        apiBase: API_BASE,
      });
      return [];
    }
    return safeJson<CategoryNode[]>(res, 'fetchCategoryTree', []);
  } catch (error) {
    devError('[api] fetchCategoryTree error', error);
    return [];
  }
}

export async function fetchFlatCategories(): Promise<CategoryNode[]> {
  try {
    const res = await fetchWithTimeout('/api/categories/flat');
    if (!res.ok) {
      devError('[api] fetchFlatCategories failed', {
        status: res.status,
        statusText: res.statusText,
        url: res.url,
      });
      return [];
    }
    return safeJson<CategoryNode[]>(res, 'fetchFlatCategories', []);
  } catch (error) {
    devError('[api] fetchFlatCategories error', error);
    return [];
  }
}

export async function fetchCategoryBySlug(slug: string): Promise<CategoryNode | null> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/v1/public/categories/${encodeURIComponent(slug)}`);
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      devError('[api] fetchCategoryBySlug failed', { status: res.status, statusText: res.statusText, slug });
      return null;
    }
    return safeJson<CategoryNode | null>(res, 'fetchCategoryBySlug', null);
  } catch (error) {
    devError('[api] fetchCategoryBySlug error', { slug, error });
    return null;
  }
}

function mapSearchResultToListing(item: Record<string, unknown>): Listing | null {
  const id = typeof item.id === 'string' ? item.id : '';
  const title = typeof item.title === 'string' ? item.title : '';
  const description = typeof item.description === 'string' ? item.description : '';

  if (!id || !title) {
    return null;
  }

  const price =
    typeof item.price === 'number'
      ? item.price
      : typeof item.price === 'string'
      ? Number.parseFloat(item.price)
      : undefined;

  const shipping =
    typeof item.shipping === 'boolean'
      ? item.shipping
      : typeof item.shipping === 'string'
      ? item.shipping.toLowerCase() === 'true'
      : undefined;

  // Latitude/Longitude können entweder als eigene Felder (latitude/longitude)
  // oder als location-Objekt { lat, lon } aus OpenSearch kommen.
  let latitude: number | undefined;
  if (typeof item.latitude === 'number') {
    latitude = item.latitude;
  } else if (typeof item.latitude === 'string') {
    const parsed = Number.parseFloat(item.latitude);
    latitude = Number.isNaN(parsed) ? undefined : parsed;
  }

  let longitude: number | undefined;
  if (typeof item.longitude === 'number') {
    longitude = item.longitude;
  } else if (typeof item.longitude === 'string') {
    const parsed = Number.parseFloat(item.longitude);
    longitude = Number.isNaN(parsed) ? undefined : parsed;
  }

  if ((latitude === undefined || longitude === undefined) && typeof item.location === 'object' && item.location !== null) {
    const loc = item.location as { lat?: unknown; lon?: unknown };
    if (latitude === undefined && (typeof loc.lat === 'number' || typeof loc.lat === 'string')) {
      const parsed = typeof loc.lat === 'number' ? loc.lat : Number.parseFloat(loc.lat);
      latitude = Number.isNaN(parsed) ? undefined : parsed;
    }
    if (longitude === undefined && (typeof loc.lon === 'number' || typeof loc.lon === 'string')) {
      const parsed = typeof loc.lon === 'number' ? loc.lon : Number.parseFloat(loc.lon);
      longitude = Number.isNaN(parsed) ? undefined : parsed;
    }
  }

  return {
    id,
    title,
    description,
    categorySlug: typeof item.categorySlug === 'string' ? item.categorySlug : '',
    status: typeof item.status === 'string' ? item.status : 'draft',
    price,
    shipping,
    sellerType: typeof item.sellerType === 'string' ? item.sellerType : undefined,
    listingType: typeof item.listingType === 'string' ? item.listingType : undefined,
    ownerId: typeof item.ownerId === 'string' ? item.ownerId : undefined,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
    images: Array.isArray(item.images) ? (item.images.filter((v): v is string => typeof v === 'string')) : [],
    latitude,
    longitude,
  };
}

export type SearchParams = {
  q?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  page?: number;
  size?: number;
  minPrice?: number;
  maxPrice?: number;
  shipping?: boolean;
  sellerType?: string;
  listingType?: string;
  /** Clientseitiger Filter: nach Kategorie filtern */
  categorySlug?: string;
};

export async function fetchSearchListings(params?: SearchParams): Promise<Listing[]> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params?.q?.trim()) {
      searchParams.set('q', params.q.trim());
    }
    if (params?.latitude !== undefined) {
      searchParams.set('latitude', params.latitude.toString());
    }
    if (params?.longitude !== undefined) {
      searchParams.set('longitude', params.longitude.toString());
    }
    if (params?.radiusKm !== undefined) {
      searchParams.set('radiusKm', params.radiusKm.toString());
    }
    if (params?.page !== undefined) {
      searchParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      searchParams.set('size', params.size.toString());
    }
    if (params?.minPrice !== undefined) {
      searchParams.set('minPrice', params.minPrice.toString());
    }
    if (params?.maxPrice !== undefined) {
      searchParams.set('maxPrice', params.maxPrice.toString());
    }
    if (params?.shipping !== undefined) {
      searchParams.set('shipping', params.shipping ? 'true' : 'false');
    }
    if (params?.sellerType) {
      searchParams.set('sellerType', params.sellerType);
    }
    if (params?.listingType) {
      searchParams.set('listingType', params.listingType);
    }

    if (params?.categorySlug) {
      searchParams.set('categorySlug', params.categorySlug);
    }

    const url = `${API_BASE}/api/v1/public/search${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const res = await fetch(url, { next: { revalidate: 30 } });
    const raw = await safeJson<SearchApiResponse | Record<string, unknown>[]>(res, 'fetchSearchListings', { items: [], total: 0, page: 0, size: 0 });
    const items = Array.isArray(raw) ? raw : raw.items;
    return (items as Record<string, unknown>[])
      .map(mapSearchResultToListing)
      .filter((listing): listing is Listing => listing !== null);
  } catch (error) {
    devError('[api] fetchSearchListings error', { params, error });
    return [];
  }
}

export type SearchFacets = {
  categories: { slug: string; count: number }[];
  shipping: { value: boolean; count: number }[];
  sellerType: { value: string; count: number }[];
  listingType: { value: string; count: number }[];
  price: { min: number | null; max: number | null };
};

/** Backend search response: items = current page, total = total hit count, optional server-side Facets. */
export type SearchApiResponse = {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  size: number;
  facets?: SearchFacets;
};

export type SearchResultWithTotal = {
  listings: Listing[];
  total: number;
  facets: SearchFacets;
};

function applySearchFilters(listings: Listing[], params?: SearchParams): Listing[] {
  let result = listings;

  if (params?.categorySlug) {
    result = result.filter((l) => l.categorySlug === params.categorySlug);
  }

  if (params?.minPrice !== undefined) {
    result = result.filter((l) => typeof l.price === 'number' && l.price >= params.minPrice!);
  }
  if (params?.maxPrice !== undefined) {
    result = result.filter((l) => typeof l.price === 'number' && l.price <= params.maxPrice!);
  }
  if (params?.shipping !== undefined) {
    result = result.filter((l) => l.shipping === params.shipping);
  }
  if (params?.sellerType) {
    result = result.filter((l) => l.sellerType === params.sellerType);
  }
  if (params?.listingType) {
    result = result.filter((l) => l.listingType === params.listingType);
  }

  return result;
}

function buildSearchFacets(listings: Listing[]): SearchFacets {
  const categoryCounts = new Map<string, number>();
  const shippingCounts = new Map<boolean, number>();
  const sellerTypeCounts = new Map<string, number>();
  const listingTypeCounts = new Map<string, number>();
  let minPrice: number | null = null;
  let maxPrice: number | null = null;

  for (const listing of listings) {
    if (listing.categorySlug) {
      categoryCounts.set(listing.categorySlug, (categoryCounts.get(listing.categorySlug) ?? 0) + 1);
    }

    if (typeof listing.price === 'number') {
      if (minPrice === null || listing.price < minPrice) minPrice = listing.price;
      if (maxPrice === null || listing.price > maxPrice) maxPrice = listing.price;
    }

    if (typeof listing.shipping === 'boolean') {
      shippingCounts.set(listing.shipping, (shippingCounts.get(listing.shipping) ?? 0) + 1);
    }

    if (listing.sellerType) {
      sellerTypeCounts.set(listing.sellerType, (sellerTypeCounts.get(listing.sellerType) ?? 0) + 1);
    }

    if (listing.listingType) {
      listingTypeCounts.set(listing.listingType, (listingTypeCounts.get(listing.listingType) ?? 0) + 1);
    }
  }

  const categories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([slug, count]) => ({ slug, count }));

  const shipping = Array.from(shippingCounts.entries())
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([value, count]) => ({ value, count }));

  const sellerType = Array.from(sellerTypeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }));

  const listingType = Array.from(listingTypeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }));

  return {
    categories,
    shipping,
    sellerType,
    listingType,
    price: { min: minPrice, max: maxPrice },
  };
}

/**
 * Such-Ergebnis mit Gesamtanzahl (total) und aktueller Seite (listings).
 * Backend liefert total = Gesamtzahl der Treffer, items = Seite (page/size).
 */
export async function fetchSearchListingsWithTotal(
  params?: SearchParams
): Promise<SearchResultWithTotal> {
  const page = params?.page ?? 0;
  const size = params?.size ?? 12;

  const searchParams = new URLSearchParams();
  if (params?.q?.trim()) searchParams.set('q', params.q.trim());
  if (params?.latitude !== undefined) searchParams.set('latitude', params.latitude.toString());
  if (params?.longitude !== undefined) searchParams.set('longitude', params.longitude.toString());
  if (params?.radiusKm !== undefined) searchParams.set('radiusKm', params.radiusKm.toString());
  searchParams.set('page', page.toString());
  searchParams.set('size', size.toString());
  if (params?.minPrice !== undefined) searchParams.set('minPrice', params.minPrice.toString());
  if (params?.maxPrice !== undefined) searchParams.set('maxPrice', params.maxPrice.toString());
  if (params?.shipping !== undefined) searchParams.set('shipping', params.shipping ? 'true' : 'false');
  if (params?.sellerType) searchParams.set('sellerType', params.sellerType);
  if (params?.listingType) searchParams.set('listingType', params.listingType);
  if (params?.categorySlug) searchParams.set('categorySlug', params.categorySlug);

  const url = `${API_BASE}/api/v1/public/search?${searchParams.toString()}`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  const data = await safeJson<SearchApiResponse>(res, 'fetchSearchListingsWithTotal', {
    items: [],
    total: 0,
    page: 0,
    size: 0,
  });

  const listings = (data.items as Record<string, unknown>[])
    .map(mapSearchResultToListing)
    .filter((listing): listing is Listing => listing !== null);

  // Facets kommen ausschließlich vom Backend (OpenSearch-Aggregationen),
  // damit Zähler immer die globale Treffermenge unter allen aktiven Filtern widerspiegeln.
  const facets: SearchFacets = data.facets ?? buildSearchFacets(listings);

  return {
    listings,
    total: data.total,
    facets,
  };
}

const GEO_API_BASE = '/api/geo';

export type Location = {
  id: number;
  countryCode: string;
  zipcode: string;
  place: string;
  state?: string;
  stateCode?: string;
  province?: string;
  provinceCode?: string;
  community?: string;
  communityCode?: string;
  latitude: number;
  longitude: number;
};

export async function searchLocations(query: string): Promise<Location[]> {
  try {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      return [];
    }

    // Try as zipcode first (if it looks like a zipcode - 5 digits)
    if (/^\d{5}$/.test(trimmedQuery)) {
      const res = await fetchWithTimeout(
        `${GEO_API_BASE}/locations/by-zipcode?zipcode=${encodeURIComponent(trimmedQuery)}`
      );
      if (res.ok) {
        const locations = await safeJson<Location[]>(res, 'searchLocationsByZipcode', []);
        return locations.slice(0, 10); // Limit to 10 results
      }
    }

    // Otherwise search by place name
    const res = await fetchWithTimeout(
      `${GEO_API_BASE}/locations/by-place?place=${encodeURIComponent(trimmedQuery)}`
    );
    if (res.ok) {
      const locations = await safeJson<Location[]>(res, 'searchLocationsByPlace', []);
      return locations.slice(0, 10); // Limit to 10 results
    }

    return [];
  } catch (error) {
    devError('[api] searchLocations error', { query, error });
    return [];
  }
}

/**
 * Reverse geocoding: Get location from coordinates
 */
export async function getLocationFromCoordinates(latitude: number, longitude: number): Promise<Location | null> {
  try {
    const res = await fetchWithTimeout(
      `${GEO_API_BASE}/locations/by-coordinates?latitude=${latitude}&longitude=${longitude}&radiusKm=1&limit=1`
    );
    if (res.ok) {
      const locations = await safeJson<Location[]>(res, 'getLocationFromCoordinates', []);
      return locations.length > 0 ? locations[0] : null;
    }
    return null;
  } catch (error) {
    devError('[api] getLocationFromCoordinates error', { latitude, longitude, error });
    return null;
  }
}

export async function fetchListing(id: string): Promise<Listing | null> {
  // Validierung: Leere oder ungültige IDs abfangen
  if (!id || id.trim() === '') {
    devError('[api] fetchListing: Empty or invalid ID provided');
    return null;
  }

  // UUID-Format validieren (optional, aber hilfreich für Debugging)
  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i;
  if (!uuidPattern.test(id)) {
    devWarn('[api] fetchListing: ID does not match UUID format', { id });
    // Trotzdem versuchen, falls das Backend andere Formate akzeptiert
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/public/listings/${id}`, { next: { revalidate: 60 } });
    return safeJson<Listing | null>(res, 'fetchListing', null);
  } catch (error) {
    devError('[api] fetchListing error', { id, error });
    return null;
  }
}

/**
 * Lädt die eigenen Anzeigen des eingeloggten Users.
 * Nutzt den geschützten Endpoint /api/v1/listings, der serverseitig nach Owner filtert.
 */
export async function fetchMyListings(token: string, userId: string): Promise<Listing[]> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/v1/listings`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
    });

    const listings = await safeJson<Listing[]>(res, 'fetchMyListings', []);
    // Zusätzliche Absicherung: nur eigene Listings anzeigen
    return listings.filter((listing) => listing.ownerId === userId);
  } catch (error) {
    devError('[api] fetchMyListings error', error);
    return [];
  }
}

export async function createListing(
  listing: Omit<Listing, 'id'> & { latitude?: number; longitude?: number },
  token: string,
  imageObjectKeys?: string[]
): Promise<Listing | null> {
  try {
    // Default coordinates (center of Germany) if not provided
    const latitude = listing.latitude ?? 51.1657;
    const longitude = listing.longitude ?? 10.4515;

    const res = await fetchWithTimeout(`${API_BASE}/api/v1/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: listing.title,
        description: listing.description,
        categorySlug: listing.categorySlug,
        status: listing.status || 'draft',
        price: listing.price,
        shipping: listing.shipping,
        sellerType: listing.sellerType,
        listingType: listing.listingType,
        latitude,
        longitude,
        imageObjectKeys: imageObjectKeys || []
      })
    });

    if (!res.ok) {
      // Try to read an error message from the backend, otherwise fall back to statusText
      try {
        const errorBody = await res.json();
        const message =
          (errorBody && (errorBody.message || errorBody.error)) ||
          `Request failed with status ${res.status}`;
        throw new Error(message);
      } catch {
        throw new Error(res.statusText || `Request failed with status ${res.status}`);
      }
    }

    return res.json();
  } catch (error) {
    devError('[api] createListing error', error);
    return null;
  }
}

export async function updateListing(
  id: string,
  listing: Omit<Listing, 'id'> & { latitude?: number; longitude?: number },
  token: string,
  imageObjectKeys?: string[]
): Promise<Listing | null> {
  try {
    // Default coordinates (center of Germany) if not provided
    const latitude = listing.latitude ?? 51.1657;
    const longitude = listing.longitude ?? 10.4515;

    const requestBody = {
      title: listing.title,
      description: listing.description,
      categorySlug: listing.categorySlug,
      status: listing.status || 'draft',
      price: listing.price,
      shipping: listing.shipping,
      sellerType: listing.sellerType,
      listingType: listing.listingType,
      latitude,
      longitude,
      imageObjectKeys: Array.isArray(imageObjectKeys) ? imageObjectKeys : []
    };

    const res = await fetchWithTimeout(`${API_BASE}/api/v1/listings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      // Try to read an error message from the backend, otherwise fall back to statusText
      let errorMessage = `Request failed with status ${res.status}`;
      try {
        const errorBody = await res.json();
        errorMessage =
          (errorBody && (errorBody.message || errorBody.error)) ||
          errorMessage;
        devError('[api] updateListing error response:', errorBody);
      } catch {
        const text = await res.text();
        devError('[api] updateListing error response (text):', text);
        if (text) {
          errorMessage = text;
        }
      }
      throw new Error(errorMessage);
    }

    return res.json();
  } catch (error) {
    devError('[api] updateListing error', error);
    throw error; // Re-throw to allow caller to handle
  }
}

export async function deleteListing(
  id: string,
  token: string
): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/v1/listings/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      let errorMessage = `Request failed with status ${res.status}`;
      try {
        const errorBody = await res.json();
        errorMessage =
          (errorBody && (errorBody.message || errorBody.error)) ||
          errorMessage;
        devError('[api] deleteListing error response:', errorBody);
      } catch {
        const text = await res.text();
        devError('[api] deleteListing error response (text):', text);
        if (text) {
          errorMessage = text;
        }
      }
      throw new Error(errorMessage);
    }

    return true;
  } catch (error) {
    devError('[api] deleteListing error', error);
    throw error; // Re-throw to allow caller to handle
  }
}

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Conversation = {
  id: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  unreadCount: number;
  lastMessage?: Message | null;
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
};

const MESSAGING_API_BASE = '/api/messaging';

export async function createConversation(
  listingId: string,
  token: string
): Promise<Conversation | null> {
  try {
    // Validate UUID format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(listingId)) {
      throw new Error('Invalid listing ID format');
    }

    const requestBody = { listingId };

    const res = await fetchWithTimeout(`${MESSAGING_API_BASE}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      let errorMessage = `Request failed with status ${res.status}`;
      try {
        const text = await res.text();
        if (text) {
          try {
            const errorDetails: { message?: string; error?: string; errors?: { message?: string }[] } = JSON.parse(text);
            if (errorDetails.message) {
              errorMessage = errorDetails.message;
            } else if (errorDetails.error) {
              errorMessage = errorDetails.error;
            } else if (Array.isArray(errorDetails.errors)) {
              errorMessage = errorDetails.errors.map((e) => e.message || String(e)).join(', ');
            }
          } catch {
            errorMessage = text || errorMessage;
          }
        }
      } catch {
        // If we can't read the response, use the status
      }
      
      // Include status code in error message for debugging
      const fullErrorMessage = `${errorMessage} (Status: ${res.status})`;
      throw new Error(fullErrorMessage);
    }

    return res.json();
  } catch (error) {
    devError('[api] createConversation error', error);
    throw error;
  }
}

export async function getConversation(
  conversationId: string,
  token: string
): Promise<Conversation | null> {
  const res = await fetchWithTimeout(
    `${MESSAGING_API_BASE}/conversations/${conversationId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    if (res.status === 404) return null;
    const text = await res.text();
    let errMsg = text;
    try {
      const j = JSON.parse(text);
      errMsg = j.message ?? j.error ?? text;
    } catch {
      // use text as-is
    }
    throw new Error(errMsg || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function sendMessage(
  conversationId: string,
  body: string,
  token: string
): Promise<Message | null> {
  const res = await fetchWithTimeout(
    `${MESSAGING_API_BASE}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ body }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    let errMsg = text;
    try {
      const j = JSON.parse(text);
      errMsg = j.message ?? j.error ?? text;
    } catch {
      // use text as-is
    }
    throw new Error(errMsg || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function getUserConversations(
  token: string
): Promise<Conversation[]> {
  const res = await fetchWithTimeout(`${MESSAGING_API_BASE}/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    let errMsg = text;
    try {
      const j = JSON.parse(text);
      errMsg = j.message ?? j.error ?? text;
    } catch {
      // use text as-is
    }
    throw new Error(errMsg || `Request failed with status ${res.status}`);
  }
  return res.json();
}
