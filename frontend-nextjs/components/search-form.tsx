'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '../i18n/navigation';
import { useState, useEffect, useRef } from 'react';
import { searchLocations } from '../lib/api';
import type { Location } from '../lib/api';

type LocationOption = {
  zipcode: string;
  place: string;
  latitude: number;
  longitude: number;
  state?: string;
};

export function SearchForm() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [locationInput, setLocationInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [suggestions, setSuggestions] = useState<LocationOption[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);
  const [isSearching, setIsSearching] = useState(false);
  
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load initial values from URL params
  useEffect(() => {
    const locationParam = searchParams.get('location');
    const latParam = searchParams.get('latitude');
    const lonParam = searchParams.get('longitude');
    const radiusParam = searchParams.get('radiusKm');
    
    if (locationParam) {
      setLocationInput(locationParam);
    }
    if (latParam && lonParam) {
      setSelectedLocation({
        zipcode: '',
        place: locationParam || '',
        latitude: parseFloat(latParam),
        longitude: parseFloat(lonParam)
      });
    }
    if (radiusParam) {
      setRadiusKm(parseInt(radiusParam));
    }
  }, [searchParams]);

  // Fetch location suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (locationInput.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const results = await searchLocations(locationInput);
        const locationOptions: LocationOption[] = results.map(loc => ({
          zipcode: loc.zipcode,
          place: loc.place,
          latitude: loc.latitude,
          longitude: loc.longitude,
          state: loc.state
        }));
        setSuggestions(locationOptions);
        setShowSuggestions(locationOptions.length > 0);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [locationInput]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationSelect = (location: LocationOption) => {
    setSelectedLocation(location);
    setLocationInput(`${location.zipcode} ${location.place}`);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleLocationInputChange = (value: string) => {
    setLocationInput(value);
    if (selectedLocation) {
      setSelectedLocation(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    const params = new URLSearchParams();
    
    if (query.trim()) {
      params.set('q', query.trim());
    }

    if (selectedLocation) {
      params.set('latitude', selectedLocation.latitude.toString());
      params.set('longitude', selectedLocation.longitude.toString());
      params.set('radiusKm', radiusKm.toString());
      params.set('location', `${selectedLocation.zipcode} ${selectedLocation.place}`);
    }

    router.push(`/suche?${params.toString()}`);
    setIsSearching(false);
  };

  const clearLocation = () => {
    setLocationInput('');
    setSelectedLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Text Search */}
      <div>
        {/*<label htmlFor="query" className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>*/}
        {/*  {t('search.textSearchLabel')}*/}
        {/*</label>*/}
        <input
          id="query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search.placeholder')}
          className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text)'
          }}
        />
      </div>

      {/* Location Search */}
      <div className="relative">
        <label htmlFor="location" className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
          {t('search.locationLabel')}
        </label>
        <div className="relative">
          <input
            id="location"
            ref={inputRef}
            type="text"
            value={locationInput}
            onChange={(e) => handleLocationInputChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder={t('search.locationPlaceholder')}
            className="w-full px-4 py-3 pr-10 rounded-lg border focus:outline-none focus:ring-2 transition-all"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)'
            }}
          />
          {selectedLocation && (
            <button
              type="button"
              onClick={clearLocation}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xl leading-none"
              style={{ color: 'var(--text-muted)' }}
              aria-label={t('search.clearLocation')}
            >
              ×
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white rounded-lg border shadow-lg max-h-60 overflow-auto"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)'
            }}
          >
            {suggestions.map((location, index) => (
              <button
                key={`${location.zipcode}-${location.place}-${index}`}
                type="button"
                onClick={() => handleLocationSelect(location)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                style={{
                  color: 'var(--text)',
                  '--hover-bg': 'var(--surface-hover)'
                } as React.CSSProperties}
              >
                <div className="font-medium">{location.zipcode} {location.place}</div>
                {location.state && (
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {location.state}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Radius Selection (only shown when location is selected) */}
      {selectedLocation && (
        <div>
          <label htmlFor="radius" className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
            {t('search.radiusLabel')}
          </label>
          <select
            id="radius"
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseInt(e.target.value))}
            className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)'
            }}
          >
            <option value="5">5 km</option>
            <option value="10">10 km</option>
            <option value="25">25 km</option>
            <option value="50">50 km</option>
            <option value="100">100 km</option>
            <option value="200">200 km</option>
            <option value="500">500 km</option>
          </select>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSearching}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSearching ? t('common.loading') : t('common.search')}
      </button>
    </form>
  );
}
