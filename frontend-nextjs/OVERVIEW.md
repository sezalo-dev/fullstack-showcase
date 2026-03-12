### Öffentliche Produktflächen

- lokalisierte Startseite
- Suchseite mit Filtern
- Anzeigen-Detailseite
- Sitemap und Robots

### Benutzerbereich

- Dashboard
- eigene Anzeigen auflisten
- Anzeige anlegen, bearbeiten, löschen
- Nachrichten-Übersicht und Nachrichten-Detail
- Profilseite

### Authentifizierung

- Login mit E-Mail/Passwort
- Registrierung mit E-Mail/Passwort
- GitHub OAuth
- Passwort-Reset
- Session-Verwaltung per Supabase
- clientseitiger Schutz für Dashboard und Profil

### Infrastruktur im Frontend

- `next-intl` für `de`, `en`, `fr`
- same-origin Proxy-Routen für Messaging, Kategorien und Geo
- API-Client für Gateway- und Service-Endpunkte
- Supabase Storage Upload für Anzeige-Bilder

## Architektur in Kurzform

- `app/[locale]` enthält die lokalisierte UI
- `app/auth/callback/route.ts` behandelt serverseitige Auth-Callbacks
- `proxy.ts` macht ausschließlich i18n-Routing
- `AuthProvider` lebt im Layout und versorgt Client-Komponenten mit Session-Daten
- `ProtectedRouteGuard` vermeidet ungewollte Server-Redirects während OAuth- und Session-Propagation

## Externe Abhängigkeiten

Für vollständige Funktionalität müssen diese Systeme erreichbar sein:

- Supabase Auth
- Supabase Storage
- Gateway-Service
- Listing-Service
- Messaging-Service
- Geo-Service
