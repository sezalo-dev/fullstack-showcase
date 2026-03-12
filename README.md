# Anzeigen-Portal Plattform

Monorepo fuer eine Microservices-Plattform rund um Anzeigen, Suche, Messaging und Verwaltung. Das Repository enthaelt Backend-Services, ein Next.js-Frontend, ein Angular-Admin-Frontend sowie die lokale Infrastruktur auf Basis von Docker Compose und self-hosted Supabase.

## Public-Repo-Hinweis

Diese veroeffentlichte Version ist bewusst leicht reduziert.

Enthalten bleiben:

- Monorepo-Struktur
- Frontend-, Admin- und Service-Aufteilung
- Beispielhafte Konfigurationen
- Architektur- und Projektbeschreibungen

Nicht enthalten sind unter anderem:

- produktionsspezifische Compose-/Env-Dateien
- Lasttest-Artefakte
- Seed-, Import- und Hilfsskripte
- weite Teile der internen Java-Service-Implementierungen

Ziel ist, Architektur und technische Entscheidungen sichtbar zu machen, ohne das interne Projekt in vollstaendiger operativer Form offenzulegen.


## Projektstatus

Dieses Projekt befindet sich weiterhin in Entwicklung. Viele Bereiche sind noch unvollstaendig oder bewusst als Integrations- und Architekturgrundlage belassen.

Fuer diese oeffentliche Repository-Version wurden einige betriebsnahe und interne Hilfsartefakte entfernt oder gekuerzt, damit Architektur, Zusammenspiel der Komponenten und Entwicklungsrichtung sichtbar bleiben, ohne den vollstaendigen internen Projektumfang offenzulegen.

## Demo-Links

- **Demo UI:** [https://preview-j7x32.opdemarkt.de/de](https://preview-j7x32.opdemarkt.de/de)
- **Demo Admin-Dashboard:** [https://preview-j7x32.opdemarkt.de/admin/auth/login](https://preview-j7x32.opdemarkt.de/admin/auth/login)
- **Demo Supabase Studio:** [https://studio.preview-j7x32.opdemarkt.de/](https://studio.preview-j7x32.opdemarkt.de/)

## Architektur auf einen Blick

- `frontend-nextjs/`
  - oeffentliches Next.js-Frontend
  - Suche, Anzeige-Detail, Login, Dashboard, Nachrichten
- `admin-dashboard-angular/`
  - separates Admin-Frontend
- `services/`
  - Java-Services fuer API, Listings, Search, Messaging, Media, Billing, Geo, Notifications und User
- `infra/`
  - Nginx- und Supabase-spezifische Infrastrukturdateien in gekuerzter Public-Form

## Aktuelle Repo-Struktur

```text
admin-dashboard-angular/
frontend-nextjs/
infra/
  nginx/
  supabase/
services/
  billing-service/
  gateway-service/
  geo-service/
  listing-service/
  media-service/
  messaging-service/
  notification-service/
  search-service/
  user-service/
docker-compose.yml
```

## Lokale Entwicklung

Der Standardpfad fuer lokale Entwicklung ist der Compose-Stack aus dem Repo. Er startet die benoetigte Infrastruktur fuer Integrations- und UI-Entwicklung.

### 1. Konfiguration anlegen

```bash
cp .env.example .env
```

Danach `.env` mit sinnvollen lokalen Werten fuellen.

### 2. Gesamten Stack starten

```bash
docker compose up -d
```

### 3. Stack stoppen

```bash
docker compose down
```

## Wichtige lokale Komponenten

Der Compose-Stack umfasst unter anderem:

- self-hosted Supabase
- Kafka + Zookeeper
- OpenSearch
- Redis
- Mailhog
- Backend-Services
- `frontend-nextjs` als `ui`
- `admin-dashboard-angular` als `admin-dashboard`
- `edge-proxy` als Einstiegspunkt

## Docker-Compose-Infrastruktur

Die zentrale Laufzeit-Infrastruktur des Projekts wird in dieser Public-Version ueber einen lokalen Docker-Compose-Stack beschrieben.

- `docker-compose.yml`
  - lokaler Entwicklungs- und Integrationsstack

### Zusammenspiel

- Die Browser-Clients laufen ueber den Reverse Proxy beziehungsweise lokal separat.
- Die Java-Services sprechen interne Compose-Hosts wie `supabase-db`, `kafka`, `opensearch` oder andere Services direkt an.
- Das oeffentliche Frontend nutzt im Browser `NEXT_PUBLIC_SUPABASE_URL`, waehrend serverseitige und interne Services die internen Container-Namen verwenden.
- Die interne Projektversion nutzt denselben Grundansatz, erweitert um produktionsspezifische Betriebsdetails, die in dieser Public-Version bewusst nicht enthalten sind.

## Frontend lokal separat starten

Wenn du nur am Next.js-Frontend arbeitest, kannst du den Infrastruktur-/Backend-Teil per Compose laufen lassen und das Frontend lokal separat starten:

```bash
cd frontend-nextjs
npm install
npm run dev
```

Weitere Details stehen in [frontend-nextjs/README.md](frontend-nextjs/README.md).

## Wichtige Konfigurationspunkte

- Lokal wird self-hosted Supabase verwendet, nicht ein externes Supabase-Cloud-Projekt.
- Die Browser-URL fuer Supabase kommt aus `NEXT_PUBLIC_SUPABASE_URL`.
- Die Java-Services sprechen die interne Datenbank im Compose-Netz ueber `supabase-db` an.
- Produktionsspezifische Konfigurationsdateien sind nicht Teil dieser oeffentlichen Version.

## Dokumentation im Repo

- [frontend-nextjs/README.md](frontend-nextjs/README.md)
  - Frontend, Auth, Routing, Storage, lokale Env-Variablen
- [frontend-nextjs/OVERVIEW.md](frontend-nextjs/OVERVIEW.md)
  - Ueberblick ueber die Produktflaechen und Frontend-Architektur
- [admin-dashboard-angular/README.md](admin-dashboard-angular/README.md)
  - Admin-Frontend, Login, Routing, lokale Entwicklung und Docker-Build

## Rechte und Nutzung

Dieses Repository ist derzeit nicht unter einer Open-Source-Lizenz veroeffentlicht. Sofern nicht anders angegeben, bleiben alle Rechte vorbehalten.
