# Frontend Next.js

Dieses Verzeichnis enthält das Next.js-Frontend für das Anzeigen-Portal. Die App nutzt den App Router, `next-intl` für Sprachrouting und Supabase für Authentifizierung, Session-Verwaltung und Storage-Uploads.

## Stack

- Next.js 16
- React 18
- TypeScript
- next-intl
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Tailwind CSS 4

## Was die App aktuell abdeckt

- Öffentliche Seiten für Startseite, Suche und Anzeigen-Detail
- Lokalisierte Routen für `de`, `en` und `fr`
- Login, Registrierung, Passwort-Reset und Profilpflege über Supabase Auth
- Geschützte Dashboard-Bereiche für eigene Anzeigen und Nachrichten
- Clientseitiger Auth-Guard mit Weiterleitung auf die Login-Seite
- Bild-Upload in einen Supabase-Storage-Bucket `media`
- Proxy-Routen für Messaging-, Kategorien- und Geo-Endpunkte

## Struktur

```text
frontend-nextjs/
  app/
    [locale]/                 Lokalisierte Pages und Dashboard-Routen
    auth/callback/route.ts    Serverseitiger OAuth-/Email-Callback
    api/                      Proxy-Endpunkte für Backend-Services
  components/                 UI-Komponenten inkl. Auth-Guard und Navigation
  i18n/                       next-intl Routing und Navigation
  lib/
    api.ts                    Frontend-API-Client für Gateway und Service-Proxies
    auth-context.tsx          Clientseitiger AuthProvider
    supabase/                 Browser- und Server-Clients
    image-upload.ts           Uploads in Supabase Storage
  messages/                   Übersetzungen
  README.md
  AUTH_QUICKSTART.md
  AUTH_SETUP.md
  AUTHENTICATION_SUMMARY.md
  OVERVIEW.md
```

## Voraussetzungen

- Node.js 20+ empfohlen
- laufende Backend-Services oder `docker compose`-Stack aus dem Repo
- erreichbare Supabase-Instanz für Auth und Storage

## Umgebungsvariablen

Die App liest sowohl Build- als auch Runtime-Konfiguration aus Environment-Variablen. Für lokale Entwicklung reicht in der Regel eine `frontend-nextjs/.env`.

### Pflicht für das Frontend

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Üblich für lokales Full-Stack-Setup

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE=http://localhost:8080
API_BASE_INTERNAL=http://gateway-service:8080
LISTING_SERVICE_BASE=http://localhost:8081
MESSAGING_SERVICE_BASE=http://localhost:8083
GEO_SERVICE_BASE=http://localhost:8087
SUPABASE_PUBLIC_URL=http://localhost:54321
```

### Wichtige Hinweise

- Der aktuelle Code nutzt für Supabase ausschließlich `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Alte Variablen wie `SUPABASE_URL` und `SUPABASE_ANON_KEY` sind für das aktuelle Frontend nicht notwendig.
- `API_BASE_INTERNAL` wird nur serverseitig genutzt, z. B. für SSR im Docker-Netzwerk.
- `NEXT_PUBLIC_API_BASE` wird im Browser für Requests an das Gateway verwendet.

## Lokale Entwicklung

1. Backend-Stack starten, z. B. über das Repo-Root mit `docker compose` oder `make up`.
2. `frontend-nextjs/.env` mit den benötigten Werten füllen.
3. Im Frontend-Verzeichnis Abhängigkeiten installieren:

```bash
npm install
```

4. Entwicklungsserver starten:

```bash
npm run dev
```

5. App unter `http://localhost:3000` aufrufen.

## Build und Start

```bash
npm run build
npm run start
```

## Routing und Lokalisierung

- Lokale werden in `i18n/routing.ts` definiert: `de`, `en`, `fr`
- `localePrefix: 'as-needed'` bedeutet:
  - Default-Locale `de` kann ohne Prefix laufen
  - andere Sprachen bekommen ein Prefix wie `/en/...`
- `proxy.ts` kümmert sich nur um i18n-Routing
- Auth-Schutz erfolgt bewusst clientseitig über `AuthProvider` und `ProtectedRouteGuard`

## Authentifizierung

### Implementierter Flow

- Login und Registrierung liegen unter `app/[locale]/auth/...`
- Der Browser-Client nutzt `@supabase/ssr` in `lib/supabase/client.ts`
- Der serverseitige Callback liegt in `app/auth/callback/route.ts`
- Vor dem GitHub-OAuth-Redirect speichert die Login-Seite `NEXT_LOCALE` und `auth_redirect_to` als Cookies
- Der Callback tauscht den Code gegen eine Session, legt bei Bedarf einen `profiles`-Datensatz an und leitet anschließend auf Zielroute oder Dashboard weiter

### Geschützte Bereiche

Geschützt sind aktuell:

- `/dashboard`
- `/dashboard/...`
- `/auth/profile`

Die Prüfung erfolgt in `lib/routes.ts` und `components/protected-route-guard.tsx`.

### Aktuelle Auth-Seiten

- `/auth/login`
- `/auth/signup`
- `/auth/reset-password`
- `/auth/profile`
- `/auth/callback`

## Supabase-Voraussetzungen

Die App erwartet mindestens:

- aktivierte Supabase Auth
- Tabelle `public.profiles`
- Storage-Bucket `media`
- passende Policies für Profilzugriffe und Bild-Uploads

Die konkreten SQL-Beispiele und Storage-Hinweise stehen in [AUTH_SETUP.md](./AUTH_SETUP.md).

## Backend-Anbindungen

### Direkt über `lib/api.ts`

- `GET /api/v1/public/listings`
- `GET /api/v1/public/listings/{id}`
- `GET /api/v1/public/search`
- `GET /api/v1/public/categories`
- `GET /api/v1/listings`
- `POST/PUT/DELETE /api/v1/listings/...`

### Über Next.js-Proxy-Routen

- `app/api/categories/flat/route.ts`
- `app/api/messaging/...`
- `app/api/geo/...`

Diese Proxy-Routen erlauben dem Frontend stabile same-origin Requests, während die eigentlichen Services über interne Basis-URLs angesprochen werden.

## Storage und Bilder

- Uploads laufen über `lib/image-upload.ts`
- Bucket-Name ist fest auf `media` gesetzt
- Pro Bild werden zwei Varianten erzeugt:
  - Vollbild
  - Thumbnail
- Uploads setzen eine authentifizierte Session voraus

Wenn der Bucket fehlt oder Policies fehlen, loggt das Frontend erklärende Fehlermeldungen in der Browser-Konsole.

## Nützliche Dokumente

- [AUTH_QUICKSTART.md](./AUTH_QUICKSTART.md): kurzer Setup-Pfad für lokale Inbetriebnahme
- [AUTH_SETUP.md](./AUTH_SETUP.md): Supabase- und Storage-Voraussetzungen im Detail
- [AUTHENTICATION_SUMMARY.md](./AUTHENTICATION_SUMMARY.md): aktuelle Auth-Architektur
- [OVERVIEW.md](./OVERVIEW.md): zusammengefasster Stand des Frontends
