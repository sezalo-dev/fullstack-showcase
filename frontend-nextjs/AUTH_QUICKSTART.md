# Auth Quickstart

Dieser Quickstart beschreibt den kürzesten Weg, um die Authentifizierung im aktuellen Frontend lokal lauffähig zu machen.

## 1. Frontend konfigurieren

Lege in `frontend-nextjs/.env` mindestens diese Werte fest:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

Wenn du den Compose-Stack aus dem Repo nutzt, passt `http://localhost:54321` für die self-hosted Supabase-Instanz.

## 2. Supabase vorbereiten

Richte in deiner Supabase-Instanz folgende Bausteine ein:

- Tabelle `public.profiles`
- Policies für `profiles`
- Storage-Bucket `media`
- Storage-Policies für authentifizierte Uploads
- Redirect-URL `http://localhost:3000/auth/callback`

Die genauen SQL-Statements stehen in [AUTH_SETUP.md](./AUTH_SETUP.md).

## 3. Frontend starten

```bash
cd frontend-nextjs
npm install
npm run dev
```

## 4. Smoke-Test

1. `http://localhost:3000/auth/signup` aufrufen
2. Benutzer per E-Mail oder GitHub anlegen
3. Nach erfolgreichem Login `/dashboard` öffnen
4. `/auth/profile` aufrufen und Profil speichern
5. `/dashboard/listings/new` öffnen und eine Anzeige mit Bild anlegen

## Verweise

- [README.md](./README.md) für den Gesamtüberblick
- [AUTH_SETUP.md](./AUTH_SETUP.md) für Datenbank-, Policy- und Storage-Setup
