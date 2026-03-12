'use client';

import Image from 'next/image';
import { DEFAULT_PUBLIC_IMAGE, getPublicImageUrl } from '@/lib/image-utils';

type PublicImageProps = {
  /** Object key from API (or full URL). Passed to getPublicImageUrl. */
  objectKey: string | null | undefined;
  alt: string;
  /** Use when the image is inside a sized container (e.g. h-40). Required for fill. */
  fill?: boolean;
  /** Hint for responsive sizes (e.g. "(max-width: 768px) 100vw, 33vw"). */
  sizes?: string;
  className?: string;
  /** Priority for above-the-fold images (e.g. hero). */
  priority?: boolean;
  /** Use thumbnail version (smaller, optimized for list views). Default: false (full size for detail view) */
  thumbnail?: boolean;
};

/**
 * Renders listing/media images with Next.js Image (optimization, lazy loading, responsive).
 * Use fill=true when the image is inside a container with defined dimensions.
 */
export function PublicImage({
  objectKey,
  alt,
  fill = true,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  className = 'object-cover',
  priority = false,
  thumbnail = false,
}: PublicImageProps) {
  const src = getPublicImageUrl(objectKey, thumbnail);
  const isStoragePublicPath = src.startsWith('/storage/v1/object/public/');

  // Next.js Image does not optimize data URLs; use img for blob previews and placeholder
  if (!src || src.startsWith('data:')) {
    return (
      <img
        src={src || DEFAULT_PUBLIC_IMAGE}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        unoptimized={isStoragePublicPath}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        fetchPriority={priority ? 'high' : 'auto'}
      />
    );
  }

  // Unused path; if you need fixed dimensions, extend this component
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      className={className}
      priority={priority}
      unoptimized={isStoragePublicPath}
    />
  );
}
