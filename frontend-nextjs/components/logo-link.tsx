'use client';

import { Link } from '@/i18n/navigation';

export function LogoLink({ appName }: { appName: string }) {
  return (
    <Link href="/" className="text-xl font-bold flex items-center gap-2 shrink-0">
      <span aria-hidden>🌾</span>
      <span className="text-[var(--primary)]">{appName}</span>
    </Link>
  );
}
