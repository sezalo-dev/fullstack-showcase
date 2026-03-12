# Auth Setup

Dieses Dokument beschreibt die Voraussetzungen für das aktuelle Frontend in `frontend-nextjs`.

## Zielbild

Das Frontend nutzt Supabase für:

- Login via E-Mail/Passwort
- GitHub OAuth
- Session-Verwaltung im Browser
- serverseitigen OAuth-Callback
- Profilverwaltung in `public.profiles`
- Bild-Uploads in Supabase Storage

## 1. Benötigte Frontend-Variablen

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Optional, aber für lokalen Vollbetrieb sinnvoll:

```env
NEXT_PUBLIC_API_BASE=http://localhost:8080
API_BASE_INTERNAL=http://gateway-service:8080
LISTING_SERVICE_BASE=http://localhost:8081
MESSAGING_SERVICE_BASE=http://localhost:8083
GEO_SERVICE_BASE=http://localhost:8087
SUPABASE_PUBLIC_URL=http://localhost:54321
```

## 2. Supabase Auth konfigurieren

### Site URL

Setze in Supabase Auth die Site URL passend zur Frontend-Instanz, lokal typischerweise:

```text
http://localhost:3000
```

### Redirect URLs

Das Frontend erwartet für OAuth und E-Mail-Callbacks:

```text
http://localhost:3000/auth/callback
https://<deine-domain>/auth/callback
```

Wichtig: Der Callback ist absichtlich nicht lokalisiert. Die Locale wird über Cookies bzw. Request-Kontext wiederhergestellt.

### GitHub Provider

Wenn GitHub OAuth genutzt werden soll:

1. GitHub OAuth App anlegen
2. Client ID und Secret in Supabase hinterlegen
3. Callback-URL in GitHub auf den von Supabase vorgegebenen Provider-Callback setzen
4. In Supabase die App-Redirects wie oben hinterlegen

## 3. Datenbank-Schema für Profile

Das Frontend liest und schreibt direkt auf `public.profiles`. Die Tabelle sollte mindestens diese Spalten haben:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  updated_at timestamptz,
  full_name text,
  avatar_url text,
  phone text,
  bio text,
  website text,
  location text,
  created_at timestamptz not null default now()
);
```

### Row Level Security

```sql
alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
```

## 4. Profil-Anlage im Auth-Flow

Der Callback in `app/auth/callback/route.ts` legt nach erfolgreichem Code-Austausch automatisch einen `profiles`-Datensatz an, falls noch keiner existiert.

Das betrifft:

- GitHub OAuth
- E-Mail-Flows, die auf `/auth/callback` zurückkommen

Unabhängig davon kann die Profilseite einen Datensatz auch per `upsert` aktualisieren oder anlegen.

## 5. Storage-Bucket für Bilder

Der Bild-Upload nutzt fest den Bucket `media`.

### Bucket anlegen

- Name: `media`
- Öffentlich lesbar oder mit passenden Public-Read-Regeln

### Upload-Policy

Mindestens authentifizierte Nutzer müssen in `storage.objects` für Bucket `media` hochladen dürfen:

```sql
create policy "media_insert_authenticated"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'media');
```

Wenn Bilder direkt über `getPublicUrl` angezeigt werden sollen, braucht es zudem Leserechte. Bei einem öffentlichen Bucket reicht die Bucket-Konfiguration. Andernfalls musst du passende `select`-Policies ergänzen.

## 6. Erwartete Smoke-Tests

Nach dem Setup sollten mindestens diese Fälle funktionieren:

1. `/auth/login` öffnet ohne Fehlermeldung
2. E-Mail-Login funktioniert
3. GitHub-OAuth kommt nach `/auth/callback` zurück
4. `/auth/profile` kann Profilfelder speichern
5. `/dashboard/listings/new` kann Bilder in den Bucket `media` hochladen
