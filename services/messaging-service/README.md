# Messaging Service

Service für den Nachrichtenaustausch zwischen Verkäufern und Interessenten (Buyern) zu Anzeigen.

## Architektur

- **Spring Boot 3.2.5** mit Java 21
- **PostgreSQL** für Datenpersistenz (via Supabase)
- **Flyway** für Datenbank-Migrationen
- **Kafka** für Event-Publishing (MessageCreated Events)
- **OAuth2/JWT** für Authentifizierung (Supabase)

## Datenbank-Schema

### `conversations`
- `id` (UUID) - Primärschlüssel
- `listing_id` (UUID) - Referenz zur Anzeige
- `seller_id` (TEXT) - Verkäufer (Listing-Owner)
- `buyer_id` (TEXT) - Interessent/Käufer
- `created_at` (TIMESTAMP) - Erstellungszeitpunkt
- `updated_at` (TIMESTAMP) - Letzte Aktualisierung

**Unique Constraint**: `(listing_id, buyer_id)` - Ein Interessent kann nur eine Konversation pro Anzeige haben

### `messages`
- `id` (UUID) - Primärschlüssel
- `conversation_id` (UUID) - Referenz zur Konversation
- `sender_id` (TEXT) - Absender (seller_id oder buyer_id)
- `body` (TEXT) - Nachrichtentext (max 5000 Zeichen)
- `read_at` (TIMESTAMP, nullable) - Gelesen-Zeitpunkt
- `created_at` (TIMESTAMP) - Erstellungszeitpunkt
- `updated_at` (TIMESTAMP) - Letzte Aktualisierung

## API Endpoints

### GET `/api/v1/conversations`
Listet alle Konversationen des authentifizierten Benutzers (als Verkäufer oder Käufer).

**Auth**: Erforderlich (ROLE_USER)

**Response**: `List<ConversationResponse>`

### POST `/api/v1/conversations`
Erstellt eine neue Konversation oder gibt eine bestehende zurück.

**Auth**: Erforderlich (ROLE_USER)

**Request Body**:
```json
{
  "listingId": "uuid"
}
```

**Response**: `ConversationResponse`

### GET `/api/v1/conversations/{id}`
Ruft eine spezifische Konversation mit allen Nachrichten ab.

**Auth**: Erforderlich (ROLE_USER)

**Response**: `ConversationResponse` (mit `messages` Array)

### POST `/api/v1/conversations/{id}/messages`
Sendet eine Nachricht in einer Konversation.

**Auth**: Erforderlich (ROLE_USER)

**Request Body**:
```json
{
  "body": "Nachrichtentext"
}
```

**Response**: `MessageResponse`

### GET `/api/v1/conversations/{id}/messages`
Ruft alle Nachrichten einer Konversation ab.

**Auth**: Erforderlich (ROLE_USER)

**Response**: `List<MessageResponse>`

### PUT `/api/v1/conversations/{id}/read`
Markiert alle ungelesenen Nachrichten in einer Konversation als gelesen.

**Auth**: Erforderlich (ROLE_USER)

**Response**: 204 No Content

## Business-Logik

1. **Konversation erstellen**:
   - Ein Interessent kann eine Konversation zu einer Anzeige starten
   - Die `sellerId` wird automatisch vom Listing-Service geholt
   - Ein Benutzer kann nicht mit sich selbst kommunizieren
   - Pro Anzeige und Käufer existiert maximal eine Konversation

2. **Nachricht senden**:
   - Nur Teilnehmer der Konversation können Nachrichten senden
   - Nachrichten werden in der Datenbank gespeichert
   - `MessageCreated` Event wird über Kafka publiziert (für Notifications)

3. **Gelesen-Status**:
   - Ungelesene Nachrichten werden für den Empfänger gezählt
   - Beim Abrufen einer Konversation können Nachrichten als gelesen markiert werden

## Events

### `MessageCreated`
Wird über Kafka Topic `messaging-events` publiziert, wenn eine neue Nachricht erstellt wird.

**Payload**:
```json
{
  "messageId": "uuid",
  "conversationId": "uuid",
  "listingId": "uuid",
  "senderId": "user-id",
  "recipientId": "user-id",
  "body": "Nachrichtentext",
  "createdAt": "2024-01-01T12:00:00Z"
}
```

## Integration mit Listing-Service

Der Messaging-Service ruft den Listing-Service auf, um die `sellerId` (Owner) einer Anzeige zu ermitteln.

**Konfiguration**:
```yaml
listing:
  service:
    url: ${LISTING_SERVICE_URL:http://localhost:8081}
```

## Sicherheit

- Alle Endpoints erfordern Authentifizierung (`ROLE_USER`)
- Benutzer können nur auf ihre eigenen Konversationen zugreifen
- Validierung, dass der Benutzer Teilnehmer der Konversation ist

## Nächste Schritte

1. **Frontend-Integration**: UI für Nachrichtenaustausch erstellen
2. **WebSocket-Support**: Echtzeit-Nachrichten via WebSocket
3. **Notification-Integration**: Notification-Service konsumiert `MessageCreated` Events
4. **Datei-Anhänge**: Unterstützung für Bilder/Dokumente in Nachrichten
5. **Nachrichten-Suche**: Volltext-Suche über Nachrichten
