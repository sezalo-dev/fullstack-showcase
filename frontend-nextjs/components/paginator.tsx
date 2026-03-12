import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

type PaginatorProps = {
  /** Zero-based current page index */
  currentPage: number;
  /** Total number of results (can be approximate on simple lists) */
  total: number;
  /** Results per page */
  pageSize: number;
  /** Builds an href for a given page (zero-based) and optional page size */
  buildPageHref: (page: number, size?: number) => string;
  /** Show "per page" size controls (search page) */
  showPageSizeControls?: boolean;
  pageSizeOptions?: number[];
};

function buildPageNumbers(currentPage: number, total: number, pageSize: number): (number | 'ellipsis')[] {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];
  const current = currentPage + 1;

  pages.push(1);

  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);

  if (start > 2) {
    pages.push('ellipsis');
  }

  for (let p = start; p <= end; p++) {
    pages.push(p);
  }

  if (end < totalPages - 1) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);
  return pages;
}

export function Paginator({
  currentPage,
  total,
  pageSize,
  buildPageHref,
  showPageSizeControls = false,
  pageSizeOptions = [6, 12, 24, 48],
}: PaginatorProps) {
  const t = useTranslations();
  const pageNumbers = buildPageNumbers(currentPage, total, pageSize);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
      {showPageSizeControls && total > 0 && (
        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>{t('search.perPage')}</span>
          <div className="flex items-center gap-2">
            {pageSizeOptions.map((size) => (
              <Link
                key={size}
                href={buildPageHref(0, size)}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-xs border ${
                  size === pageSize ? 'bg-[var(--primary)] text-white' : ''
                }`}
              >
                {size}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {pageNumbers.map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`e-${idx}`} className="px-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildPageHref(p - 1, pageSize)}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                p === currentPage + 1 ? 'bg-[var(--border)]' : ''
              }`}
            >
              {p}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}

