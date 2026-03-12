# Authentication Summary

Diese Zusammenfassung beschreibt die aktuelle Auth-Architektur des Frontends.

## Kernbausteine

- `lib/auth-context.tsx`
  - hält `user`, `session`, `loading`
  - registriert `onAuthStateChange`
  - stellt `signOut()` bereit
- `lib/supabase/client.ts`
  - Browser-Client auf Basis von `@supabase/ssr`
- `lib/supabase/server.ts`
  - Server-Client mit Cookie-Weitergabe
- `app/auth/callback/route.ts`
  - tauscht OAuth-/Magic-Link-Code gegen Session
  - erzeugt bei Bedarf einen `profiles`-Datensatz
  - leitet auf Dashboard oder `redirectTo` weiter
- `components/protected-route-guard.tsx`
  - schützt `/dashboard` und `/auth/profile` clientseitig

## Unterstützte Flows

### E-Mail und Passwort

- Registrierung über `/auth/signup`
- Login über `/auth/login`
- Passwort-Reset über `/auth/reset-password`

### GitHub OAuth

- Start über `signInWithGithub()`
- Redirect immer auf `/auth/callback`
- Locale und Zielpfad werden vor dem Redirect als Cookies gespeichert

## Weiterleitungen

- nicht authentifizierte Nutzer auf geschützten Routen werden nach `/auth/login?redirectTo=...` geschickt
- nach erfolgreichem Login wird auf die ursprüngliche Zielseite zurückgeleitet
- wenn kein Ziel vorhanden ist, geht es auf `/<locale>/dashboard`

## Datenabhängigkeiten

Das Frontend erwartet folgende Supabase-Ressourcen:

- `public.profiles`
- Auth-Provider
- Storage-Bucket `media`

## Wichtige Dateien

- `app/[locale]/auth/login/page.tsx`
- `app/[locale]/auth/signup/page.tsx`
- `app/[locale]/auth/reset-password/page.tsx`
- `app/[locale]/auth/profile/page.tsx`
- `app/auth/callback/route.ts`
- `lib/routes.ts`
- `proxy.ts`
