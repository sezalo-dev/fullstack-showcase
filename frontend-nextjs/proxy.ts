import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  // Keep proxy focused on i18n routing. Auth protection stays client-side
  // via AuthProvider + ProtectedRouteGuard to avoid false redirects during
  // OAuth callback/session propagation.
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|auth/callback).*)'
  ]
};
