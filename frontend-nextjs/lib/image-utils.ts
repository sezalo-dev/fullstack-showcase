const STORAGE_BUCKET = 'media';
const STORAGE_PUBLIC_MARKER = '/storage/v1/object/public/';
export const DEFAULT_PUBLIC_IMAGE = '/storage/v1/object/public/media/category-defaults/agriConsulting.jpg';

function encodeObjectKey(key: string): string {
  return key
    .split('/')
    .filter((part) => part.length > 0)
    .map((part) => encodeURIComponent(part))
    .join('/');
}

function toRelativeStoragePath(bucket: string, objectKey: string): string {
  const encodedKey = encodeObjectKey(objectKey);
  return `${STORAGE_PUBLIC_MARKER}${bucket}/${encodedKey}`;
}

function normalizeStorageUrlToRelativePath(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.includes(STORAGE_PUBLIC_MARKER)) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    // Keep original URL if parsing fails.
  }

  return url;
}

function normalizeStorageUrlToCurrentHost(url: string): string {
  try {
    const parsed = new URL(url);
    const idx = parsed.pathname.indexOf(STORAGE_PUBLIC_MARKER);
    if (idx === -1) {
      return url;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return normalizeStorageUrlToRelativePath(url);
  }
}

/**
 * Convert a media object_key to a public image URL.
 * Supports both Supabase Storage keys and full URLs (e.g. from external sources).
 * @param objectKey The object_key from media_objects table (can be a Storage key or full URL)
 * @param useThumbnail If true, returns thumbnail version (for list views). Default: false (full size for detail view)
 * @returns Public URL to the image
 */
export function getPublicImageUrl(objectKey: string | null | undefined, useThumbnail: boolean = false): string {
  if (!objectKey) {
    return DEFAULT_PUBLIC_IMAGE; // fallback image
  }

  // Wenn es bereits eine vollständige URL ist (http:// oder https://), direkt zurückgeben
  if (objectKey.startsWith('http://') || objectKey.startsWith('https://')) {
    return normalizeStorageUrlToCurrentHost(objectKey);
  }

  // Für Thumbnail: Füge "_thumb" vor der Dateiendung hinzu
  let keyToUse = objectKey;
  if (useThumbnail) {
    const lastDotIndex = objectKey.lastIndexOf('.');
    if (lastDotIndex > 0) {
      const baseName = objectKey.substring(0, lastDotIndex);
      const extension = objectKey.substring(lastDotIndex);
      // Prüfe ob bereits "_thumb" vorhanden ist (falls Backend schon thumbnailKey speichert)
      if (!baseName.endsWith('_thumb')) {
        keyToUse = `${baseName}_thumb${extension}`;
      }
    }
  }

  // Ansonsten als Supabase Storage Key behandeln (immer relativer Pfad fÃ¼r same-origin Proxy-Setup)
  return toRelativeStoragePath(STORAGE_BUCKET, keyToUse);
}

/**
 * Convert an array of object_keys to an array of public URLs.
 * @param objectKeys Array of object_keys from media_objects
 * @returns Array of public URLs
 */
export function getPublicImageUrls(objectKeys: string[]): string[] {
  return objectKeys.map((key) => getPublicImageUrl(key));
}
