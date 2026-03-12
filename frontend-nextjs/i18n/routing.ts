import { defineRouting } from 'next-intl/routing';

export const locales = ['de', 'en', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'de';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always'
});
