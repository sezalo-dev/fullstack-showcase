'use client';

import { useEffect, useState } from 'react';
import { getLocationFromCoordinates, type Location } from '@/lib/api';
import { useTranslations } from 'next-intl';

interface LocationDisplayProps {
  latitude?: number;
  longitude?: number;
  className?: string;
}

export function LocationDisplay({ latitude, longitude, className = '' }: LocationDisplayProps) {
  const t = useTranslations();
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      setLoading(true);
      getLocationFromCoordinates(latitude, longitude)
        .then((loc) => {
          setLocation(loc);
        })
        .catch((error) => {
          console.error('Error fetching location:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [latitude, longitude]);

  // Always render a container with fixed height to prevent layout shifts
  // Use min-height to accommodate loading/error states
  return (
    <span 
      className={className} 
      style={{ 
        color: 'var(--text-muted)',
        display: 'inline-block',
        minHeight: '1.25em', // Reserve space for text
        verticalAlign: 'top'
      }}
    >
      {loading ? (
        <span style={{ opacity: 0.5 }}>{t('common.loading')}...</span>
      ) : location ? (
        <>📍 {location.zipcode} {location.place}{location.state && `, ${location.state}`}</>
      ) : null}
    </span>
  );
}
