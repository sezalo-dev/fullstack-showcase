'use client';

import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { searchLocations, type Location, type CategoryNode, getLocationFromCoordinates } from '@/lib/api';
import { uploadImages, createImagePreview, type UploadedImage } from '@/lib/image-upload';
import { getPublicImageUrl } from '@/lib/image-utils';

export type ListingFormMode = 'new' | 'edit';

export type ListingFormValues = {
  title: string;
  description: string;
  categorySlug: string;
  price: number;
  shipping: boolean;
  sellerType: 'privateSeller' | 'business';
  listingType: 'offer' | 'search';
  status?: 'draft' | 'published' | 'sold';
  latitude: number;
  longitude: number;
};

type ListingFormInitial = Partial<ListingFormValues> & {
  existingImages?: string[];
};

export type ListingFormProps = {
  mode: ListingFormMode;
  initialValues?: ListingFormInitial;
  categories: CategoryNode[];
  backHref: string;
  /** onSubmit bekommt aktuelle Werte, neue Dateien und verbleibende bestehende Bild-Keys */
  onSubmit: (values: ListingFormValues, newFiles: File[], existingImageKeys: string[]) => Promise<void>;
};

export function ListingForm({ mode, initialValues, categories, backHref, onSubmit }: ListingFormProps) {
  const t = useTranslations();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: initialValues?.title ?? '',
    description: initialValues?.description ?? '',
    categorySlug: initialValues?.categorySlug ?? (categories[0]?.slug ?? ''),
    price: initialValues?.price != null ? String(initialValues.price) : '',
    shipping: (initialValues?.shipping ?? false) ? 'true' : 'false',
    sellerType: initialValues?.sellerType ?? 'privateSeller',
    listingType: initialValues?.listingType ?? 'offer',
    status: initialValues?.status ?? 'draft',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Location autocomplete state
  const [locationInput, setLocationInput] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Image upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialValues?.existingImages ?? []);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wenn noch keine Kategorie gesetzt ist und Kategorien nachgeladen werden,
  // automatisch erste Kategorie als Default wählen (nur für "new").
  useEffect(() => {
    if (mode === 'new' && !formData.categorySlug && categories.length > 0) {
      setFormData((prev) => ({
        ...prev,
        categorySlug: categories[0]!.slug,
      }));
    }
  }, [mode, categories, formData.categorySlug]);

  // initial location display for edit mode
  useEffect(() => {
    if (initialValues?.latitude != null && initialValues?.longitude != null && !locationInput) {
      void (async () => {
        const loc = await getLocationFromCoordinates(initialValues.latitude!, initialValues.longitude!);
        if (loc) {
          setSelectedLocation(loc);
          setLocationInput(`${loc.zipcode} ${loc.place}`);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues?.latitude, initialValues?.longitude]);

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
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
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
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationSelect = (location: Location) => {
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

  const clearLocation = () => {
    setLocationInput('');
    setSelectedLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Handle image file selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 10 images
    const filesToAdd = files.slice(0, 10 - selectedFiles.length - existingImages.length);
    if (filesToAdd.length === 0) return;

    setSelectedFiles(prev => [...prev, ...filesToAdd]);

    const previewPromises = filesToAdd.map(file => createImagePreview(file));
    const previews = await Promise.all(previewPromises);
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedLocation) {
      setError(t('listings.locationRequired'));
      return;
    }

    setIsSubmitting(true);
    setIsUploadingImages(true);

    try {
      // Upload images first if any are selected
      let newFiles = selectedFiles;
      // Upload selbst erfolgt im parent via onSubmit (dort ist Auth-Kontext verfügbar)

      const priceNumber = Number.parseFloat(formData.price);
      const values: ListingFormValues = {
        title: formData.title,
        description: formData.description,
        categorySlug: formData.categorySlug,
        price: Number.isNaN(priceNumber) ? 0 : priceNumber,
        shipping: formData.shipping === 'true',
        sellerType: formData.sellerType as any,
        listingType: formData.listingType as any,
        status: formData.status as any,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      };

      await onSubmit(values, newFiles, existingImages);
    } catch (err) {
      const message = (err as Error).message || t('common.error');
      setError(message);
    } finally {
      setIsSubmitting(false);
      setIsUploadingImages(false);
    }
  };

  return (
    <section className="py-12 px-4 max-w-2xl mx-auto">
      <Link href={backHref} className="inline-flex items-center mb-8 font-semibold transition-colors" style={{ color: 'var(--primary)' }}>
        ← {mode === 'new' ? t('common.backToDashboard') : t('common.back')}
      </Link>

      <div className="card p-8 shadow-lg">
        <h1 className="mb-2">
          {mode === 'new' ? t('listings.newListing') : t('listings.editListing')}
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
          {mode === 'new' ? t('listings.newListingDesc') : t('listings.editListingDesc')}
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border)', borderWidth: 1, borderStyle: 'solid' }}>
            <p className="font-semibold">{t('common.error')}:</p>
            <p style={{ color: 'var(--text)' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>
              {t('listings.titleLabel')} <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('listings.titlePlaceholder')}
              className="w-full px-4 py-2 rounded-lg"
              required
              minLength={5}
            />
          </div>

          <div>
            <label htmlFor="categorySlug" className="block mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>
              {t('listings.categoryLabel')} <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <select
              id="categorySlug"
              name="categorySlug"
              value={formData.categorySlug}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg"
            >
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {t(cat.translationKey as any)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>
                {t('listings.priceLabel')} <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg"
                min={0.01}
                step={0.01}
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>
                Versand
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="shipping"
                    value="false"
                    checked={formData.shipping === 'false'}
                    onChange={handleChange}
                  />
                  <span>Nur Abholung</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="shipping"
                    value="true"
                    checked={formData.shipping === 'true'}
                    onChange={handleChange}
                  />
                  <span>Mit Versand</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sellerType" className="block mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>
                Verkäufer
              </label>
              <select
                id="sellerType"
                name="sellerType"
                value={formData.sellerType}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg"
              >
                <option value="privateSeller">Privat</option>
                <option value="business">Gewerblich</option>
              </select>
            </div>

            <div>
              <label htmlFor="listingType" className="block mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>
                Anzeigentyp
              </label>
              <select
                id="listingType"
                name="listingType"
                value={formData.listingType}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg"
              >
                <option value="offer">Angebot</option>
                <option value="search">Gesuch</option>
              </select>
            </div>
          </div>

          {mode === 'edit' && (
            <div>
              <label htmlFor="status" className="block mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>
                {t('listings.statusLabel')}
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg"
              >
                <option value="draft">{t('listings.status.draft')}</option>
                <option value="published">{t('listings.status.published')}</option>
                <option value="sold">{t('listings.status.sold')}</option>
              </select>
            </div>
          )}

          <div>
            <label htmlFor="description" className="block mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>
              {t('listings.descriptionLabel')} <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('listings.descriptionPlaceholder')}
              className="w-full px-4 py-2 rounded-lg resize-vertical min-h-32"
              required
              minLength={20}
            />
          </div>

          <div className="relative">
            <label htmlFor="location" className="block mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>
              {t('search.locationLabel')} <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <div className="relative">
              <input
                ref={locationInputRef}
                type="text"
                id="location"
                value={locationInput}
                onChange={(e) => handleLocationInputChange(e.target.value)}
                placeholder={t('search.locationPlaceholder')}
                className="w-full px-4 py-2 rounded-lg"
                required
                aria-invalid={locationInput.length > 0 && !selectedLocation}
              />
              {selectedLocation && (
                <button
                  type="button"
                  onClick={clearLocation}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-sm rounded"
                  style={{ backgroundColor: 'var(--surface-hover)' }}
                  title={t('search.clearLocation')}
                >
                  ✕
                </button>
              )}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border max-h-60 overflow-y-auto"
                style={{ borderColor: 'var(--border)' }}
              >
                {suggestions.map((location, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleLocationSelect(location)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                    style={{
                      backgroundColor: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-hover)',
                      color: 'var(--text)'
                    }}
                  >
                    <div className="font-semibold">{location.zipcode} {location.place}</div>
                    {location.state && (
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{location.state}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="images" className="block mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>
              {t('listings.imagesLabel')} ({existingImages.length + selectedFiles.length}/10)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              id="images"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={existingImages.length + selectedFiles.length >= 10}
                className="px-4 py-3 rounded-lg border-2 border-dashed transition"
                style={{
                  borderColor: existingImages.length + selectedFiles.length >= 10 ? 'var(--border)' : 'var(--primary)',
                  backgroundColor: 'var(--surface-hover)',
                  color: existingImages.length + selectedFiles.length >= 10 ? 'var(--text-muted)' : 'var(--text)',
                  cursor: existingImages.length + selectedFiles.length >= 10 ? 'not-allowed' : 'pointer'
                }}
              >
                {t('listings.addImages')}
              </button>

              {/* Existing images */}
              {existingImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {existingImages.map((imageKey, index) => (
                    <div key={`existing-${index}`} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface-hover)' }}>
                        <img
                          src={getPublicImageUrl(imageKey)}
                          alt={`Existing ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white transition-opacity"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                        title={t('listings.removeImage')}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New image previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface-hover)' }}>
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white transition-opacity"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                        title={t('listings.removeImage')}
                      >
                        ✕
                      </button>
                      {isUploadingImages && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                          <div className="text-white text-sm">{t('listings.uploading')}...</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {(existingImages.length > 0 || selectedFiles.length > 0) && (
              <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                {t('listings.imagesNote')}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {mode === 'new'
                ? (isSubmitting ? t('listings.creating') : t('listings.createButton'))
                : (isSubmitting ? t('listings.updating') : t('listings.updateButton'))}
            </button>
            <button
              type="button"
              onClick={() => router.push(backHref)}
              className="flex-1 btn-secondary"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

