'use client';

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

export function HeaderSearch() {
  const t = useTranslations();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [suggestions, setSuggestions] = useState<LocationOption[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);
  
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

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
        !inputRef.current.contains(event.target as Node) &&
        expandedRef.current &&
        !expandedRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setShowExpanded(false);
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
    setShowExpanded(false);
  };

  const clearLocation = () => {
    setLocationInput('');
    setSelectedLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative flex-1 max-w-md" ref={expandedRef}>
      {showExpanded ? (
        // Expanded search form
        <form onSubmit={handleSubmit} className="absolute top-full left-0 right-0 mt-2 p-4 rounded-lg border shadow-lg z-50" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="space-y-3">
            {/* Text Search */}
            <div>
              {<label htmlFor="header-query" className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>
                {t('search.textSearchLabel')}
              </label>}
              <input
                id="header-query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)'
                }}
                autoFocus
              />
            </div>

            {/* Location Search */}
            <div className="relative">
              <label htmlFor="header-location" className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>
                {t('search.locationLabel')}
              </label>
              <div className="relative">
                <input
                  id="header-location"
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
                  className="w-full px-3 py-2 text-sm pr-8 rounded-lg border focus:outline-none focus:ring-2 transition-all"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-lg leading-none"
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
                  className="absolute z-50 w-full mt-1 bg-white rounded-lg border shadow-lg max-h-48 overflow-auto"
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
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                      style={{
                        color: 'var(--text)',
                        '--hover-bg': 'var(--surface-hover)'
                      } as React.CSSProperties}
                    >
                      <div className="font-medium">{location.zipcode} {location.place}</div>
                      {location.state && (
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
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
                <label htmlFor="header-radius" className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>
                  {t('search.radiusLabel')}
                </label>
                <select
                  id="header-radius"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-all"
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

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="btn-primary flex-1 text-sm py-2"
              >
                {t('common.search')}
              </button>
              <button
                type="button"
                onClick={() => setShowExpanded(false)}
                className="px-4 py-2 text-sm rounded-lg border transition"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)'
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </form>
      ) : (
        // Compact search button/input
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExpanded(true)}
            className="w-full px-4 py-2 text-sm rounded-lg border flex items-center gap-2 transition"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-muted)'
            }}
          >
            <span>🔍</span>
            <span className="hidden sm:inline">{t('search.placeholder')}</span>
            <span className="sm:hidden">{t('common.search')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
