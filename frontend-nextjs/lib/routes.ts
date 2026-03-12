export const protectedRoutes = ['/dashboard', '/auth/profile'] as const;

function normalizePath(pathname: string): string {
  if (!pathname) return '/';
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function matchesProtectedRoute(pathname: string): boolean {
  const normalized = normalizePath(pathname);

  return protectedRoutes.some((route) => {
    const normalizedRoute = normalizePath(route);
    return normalized === normalizedRoute || normalized.startsWith(`${normalizedRoute}/`);
  });
}
