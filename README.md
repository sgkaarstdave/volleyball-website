# RallyBoard
Mobile Volleyball-Scouting für SG Kaarst. GitHub Pages, ohne Build-Abhängigkeiten.

## Betrieb
`node --test` prüft Import, Migration, Undo, Wechsel und Event-Deduplizierung.
`node preview.mjs` startet die lokale Vorschau auf http://127.0.0.1:4173.
GitHub Pages veröffentlicht die statischen Dateien. Alle URLs sind relativ zum Repositorypfad.

## Daten
IndexedDB `rallyboard-v2` ist die führende lokale Datenbank. Migration aus `rallyboard-v1` verändert den bisherigen localStorage-Eintrag nicht; zusätzlich wird dessen Original in IndexedDB unter `legacy-original` archiviert. Fehler beim Lesen stoppen den Start, statt Daten still zu ersetzen. Änderungen werden erst nach Abschluss der Speichertransaktion bestätigt. Eine zweite offene App-Instanz lädt bei Änderungen neu; paralleles Tracking in mehreren Tabs ist nicht unterstützt.
Historischer Import `historical-2026-11-14` ist idempotent: 58 Kills, 41 Zuspiele, 33 bekannte Teamfehler. Keine erfundenen Events oder Uhrzeiten. Fehlende Ergebnisse und Fehler bleiben unbekannt. Historische Aufstellungen sind unbekannt und werden nicht nachgebildet.
Backups werden zusammengeführt, niemals still ersetzt. Konflikte bei gleicher Spieltag-ID brechen den Import ab. Regelmäßige JSON-Backups sind erforderlich, weil iOS Browserdaten löschen kann. Die bisherige Browserinstallation wird nur am gleichen Ursprung und Browser migriert; Safari und installierte PWAs können getrennte Speicher haben: gegebenenfalls JSON exportieren/importieren.

## Offline / iPhone
Nach vollständigem ersten Laden installiert der Service Worker die App-Dateien. Safari: Teilen → Zum Home-Bildschirm. Offline werden alle Aktionen einschließlich Undo lokal gespeichert. Noch keine Cloud-Synchronisierung: Die Oberfläche zeigt dies ausdrücklich an. Bei Updates alle geöffneten App-Fenster schließen und neu öffnen.

## Supabase noch einzurichten
Nur neues, separates RallyBoard-Projekt. `supabase/001_rallyboard.sql` vorbereitet, noch nicht in einer echten Datenbank ausgeführt. Admin per SQL freischalten; öffentliche Registrierung deaktivieren. Kein Service-Role-Key im Frontend. Für die spätere Anbindung werden Projekt-URL, öffentlicher Publishable-Key und eingerichteter Admin benötigt. MiSai Hub wird nicht verwendet. UUIDs und Undo-Tombstones sind für idempotenten Sync vorbereitet; Transport, Login und Konfliktabgleich fehlen noch.

## Grenzen / offene Erweiterungen
Kein React/Vite-Umbau: die App bleibt bewusst ohne Paketinstallation betreibbar. Echte Angriffsquoten brauchen zusätzlich vollständig erfasste Angriffsversuche. Rotation, Einsatzzeiten, Aufschlagserien, Diagramme zur Entwicklung und automatischer WVV-Spielplanimport sind noch nicht implementiert. Spielbericht als strukturierter JSON-Export. Kein direkter Geräte-Test auf iPhone/Safari erfolgt.

## Supabase-Anbindung ergänzt
Das separate Projekt odghcjkznmxaeqlrvtbs ist mit ausschließlich öffentlichem Publishable-Key konfiguriert. Tabellen sind eingerichtet; anonyme Lesezugriffe auf alle drei Tabellen wurden mit HTTP 401 abgelehnt. SQL-Dateien 001 und 002 enthalten RLS und einen atomaren, revisionsgeprüften Abgleich. Admin-Login findet unter Team statt; Passwort wird nie gespeichert, Tokens liegen nur im sessionStorage des jeweiligen App-Fensters. Nach erneutem Öffnen kann eine neue Anmeldung nötig sein.
Automatischer Abgleich nach lokaler Änderung/Netzrückkehr sowie manueller Abgleich unterstützen feste Event-UUIDs und Undo-Markierungen. Serverkonflikte werden ausdrücklich gemeldet und bleiben lokal erhalten. Während laufender Netzübertragung neu erfasste Aktionen werden nicht überschrieben. Kader, MVP-Gewichte und Aktionsreihenfolge werden ebenfalls synchronisiert.
Zusätzliche Tests prüfen JSONB-Schlüsselreihenfolge, Konflikte, parallele lokale Änderungen, Event-IDs, Undo-Markierungen und Netzfehler. Ein tatsächlicher Login und authentifizierter Schreib-/Lesetest stehen noch aus und benötigen die Anmeldung des Benutzers in der App.
