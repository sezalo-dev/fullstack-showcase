# Admin Dashboard Angular

Angular-Frontend für administrative Funktionen des Anzeigen-Portals. Die App ist vom öffentlichen Next.js-Frontend getrennt und spricht Admin-Endpunkte des Gateway-Service an. Authentifizierung läuft über Supabase.

## Stack

- Angular 17
- Angular Material
- RxJS
- Supabase JS Client
- Nginx für den Runtime-Container

## Was die App aktuell abdeckt

- Login per E-Mail/Passwort über Supabase
- geschützte Admin-Shell mit Route Guards
- Dashboard mit Kennzahlen
- User-Liste mit Suche und Pagination
- Anzeigen-Liste mit Suche, Statusfilter und Pagination
- Reindex-Trigger für den Suchindex
- Einstellungs- und Passwortänderungsseiten

Noch nicht vollständig umgesetzt:

- Messaging ist aktuell nur ein Platzhalter
- Detailansichten für User und Anzeigen sind noch nicht ausgebaut

## Relevante Struktur

```text
admin-dashboard-angular/
  src/
    app/
      core/
        guards/
        interceptors/
        services/
      features/
        ads/
        auth/
        messaging/
        metrics/
        users/
      layout/
    environments/
  infra/
    nginx.conf
  Dockerfile
  angular.json
```

## Routing

Die wichtigsten Routen sind:

- `/auth/login`
- `/auth/change-password`
- `/dashboard`
- `/users`
- `/ads`
- `/messaging`
- `/settings`

`authGuard` schützt die Admin-Shell. `authOnlyGuard` verhindert, dass bereits eingeloggte Nutzer auf den Login zurückfallen.

## Auth-Modell

- Login erfolgt über Supabase `signInWithPassword`
- Das Access Token wird lokal unter `admin_token` gespeichert
- Ein HTTP-Interceptor hängt das Bearer-Token an Requests gegen die Admin-API
- Für erfolgreiche API-Zugriffe muss der Benutzer serverseitig Admin-Rechte besitzen

Praktisch heißt das: Das Angular-Frontend selbst verwaltet nur Login und Tokenweitergabe. Ob ein Benutzer wirklich Admin ist, prüfen die Backend-Endpunkte.

## Lokale Entwicklung

### Voraussetzungen

- Node.js 20+ empfohlen
- laufender lokaler Stack aus dem Repo oder zumindest:
  - Supabase
  - Gateway-Service

### Default-Konfiguration

Die lokale Entwicklungsumgebung ist bereits in `src/environments/environment.ts` hinterlegt:

```ts
apiBaseUrl: 'http://localhost:8080'
supabaseUrl: 'http://localhost:54321'
```

Der lokale Anon Key muss ggf. noch in `src/environments/environment.ts` oder über einen anderen Workflow gesetzt werden.

### Starten

```bash
cd admin-dashboard-angular
npm install
npm start
```

Danach ist die App unter `http://localhost:4200/` erreichbar.

## Produktion und Docker-Build

Für Produktion wird `src/environments/environment.prod.ts` verwendet. Die Datei enthält Platzhalter und wird im Docker-Build mit Build-Args ersetzt.

### Verwendete Build-Args

- `API_BASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Diese Werte werden im [Dockerfile](./Dockerfile) in `environment.prod.ts` injiziert.

### Wichtige Build-Eigenschaften

- Production-Build mit `--configuration production`
- `--base-href /admin/`
- Runtime über Nginx

Das bedeutet: Die Anwendung ist für Deployment unter `/admin/` gedacht, nicht für Root `/`.

## Integration ins Gesamtprojekt

Im Compose-Stack wird die App als `admin-dashboard` gebaut und hinter dem zentralen Proxy ausgeliefert. Die Build-Args kommen aus den Umgebungsvariablen des Hauptprojekts, insbesondere:

- `ADMIN_API_BASE_URL`
- `ADMIN_SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Die produktive Compose-Konfiguration findest du im Repo-Root in:

- [../docker-compose.yml](../docker-compose.yml)
- [../docker-compose.prod.yml](../docker-compose.prod.yml)

## Genutzte Admin-Endpunkte

Die App spricht aktuell diese API-Bereiche an:

- `/api/v1/admin/users`
- `/api/v1/admin/listings`
- `/api/v1/admin/search/reindex`

Die Requests laufen gegen `environment.apiBaseUrl` und erhalten über den Interceptor automatisch den Bearer-Token.

## Tests und Build

```bash
npm run build
npm test
```

## Generierte Verzeichnisse

Diese Ordner sind generierte Artefakte und nicht die fachliche Quelle:

- `.angular/`
- `dist/`
- `node_modules/`

## Hinweise

- Die bisherige README war weitgehend Angular-CLI-Standardtext und deckte den echten Projektkontext kaum ab.
- Für produktive Nutzung muss Supabase erreichbar sein und der verwendete Benutzer muss durch Backend/JWT als Admin anerkannt werden.
