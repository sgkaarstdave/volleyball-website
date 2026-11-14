# RallyBoard
Mobile Volleyball-Scouting für SG Kaarst. Veröffentlichung über GitHub Pages, ohne Build-Abhängigkeiten.

## Betrieb
`node --test` prüft historische Daten, Migration, Undo, Wechsel, Offline-Shell und Cloud-Abgleich.
`node preview.mjs` startet die lokale Vorschau auf http://127.0.0.1:4173.
GitHub Pages veröffentlicht die statischen Dateien. Alle App-URLs berücksichtigen den Repository-Unterpfad.

## Lokale Daten und Migration
IndexedDB `rallyboard-v2` ist die führende lokale Datenbank. Migration aus `rallyboard-v1` verändert den bisherigen localStorage-Eintrag nicht; zusätzlich wird dessen Original unter `legacy-original` archiviert. Fehler beim Lesen stoppen den Start. Änderungen werden erst nach Abschluss der Speichertransaktion bestätigt. Eine zweite offene App-Instanz lädt bei Änderungen neu; paralleles Tracking in mehreren Tabs ist nicht unterstützt.
Historischer Import `historical-2026-11-14`: 58 Kills, 41 Zuspiele, 33 bekannte Teamfehler. Idempotente Satzaggregate, keine erfundenen Ereignisse oder Uhrzeiten. Fehlende Ergebnisse und Fehler bleiben unbekannt. Historische Aufstellungen sind unbekannt.
JSON-Backups werden zusammengeführt. Konflikte bei gleicher Spieltag-ID brechen den Import ab. Regelmäßig Backups herunterladen, weil iOS Browserdaten löschen kann. Migration erfolgt nur am gleichen Ursprung und Browser; Safari und installierte PWAs können getrennte Speicher haben: gegebenenfalls JSON exportieren/importieren.

## Offline / iPhone
Nach vollständigem ersten Laden installiert der Service Worker die App-Dateien. Safari: Teilen → Zum Home-Bildschirm. Aktionen und Undo funktionieren lokal. Vollständige neue App-Shells aktivieren sich nach dem Caching; laufende lokale Speichertransaktionen werden vor einem automatischen Neuladen abgewartet.

## Eigenes Supabase-Projekt
Konfiguriert ist ausschließlich `odghcjkznmxaeqlrvtbs` mit öffentlichem Publishable-Key. MiSai Hub wird nicht verwendet. `supabase/001_rallyboard.sql` erstellt RLS-geschützte Tabellen; `002_sync.sql` ergänzt einen atomaren Abgleich mit Revisionsprüfung. Der Benutzer hat die Einrichtung bestätigt. Anonyme Lesezugriffe auf alle drei Tabellen wurden mit HTTP 401 verweigert. Öffentliche Registrierung im Supabase-Dashboard deaktivieren und nur den eigenen Admin in `rallyboard_admins` freischalten.
Unter Team mit E-Mail und Passwort anmelden. Das Passwort wird nie gespeichert. Sitzungstokens liegen nur im sessionStorage des jeweiligen App-Fensters; nach erneutem Öffnen kann eine Anmeldung nötig sein. Keine Spieleraccounts. Kein Service-Role-Key im Frontend.
Automatischer Sync nach lokaler Änderung und Netzrückkehr, zusätzlich manueller Sync. Stabile Event-UUIDs verhindern doppelte Events; Undo überträgt Markierungen. Spieltag, Kader, MVP-Gewichte und Aktionsreihenfolge werden synchronisiert. Revisionskonflikte stoppen den Abgleich und lassen lokale Daten bestehen. Während laufender Netzübertragung neu erfasste Aktionen bleiben erhalten. Lokale Änderungen warten offline auf die nächste Anmeldung/Verbindung.
Tatsächlicher authentifizierter Ende-zu-Ende-Abgleich und RLS unter mehreren Benutzerrollen stehen noch aus; der Benutzer muss sich selbst in der App anmelden. Tests verwenden einen simulierten Auth-/RPC-Transport.

## Weitere Grenzen
Kein React/Vite-Umbau: die App bleibt ohne Paketinstallation betreibbar. Echte Erfolgsquoten benötigen vollständig erfasste Versuche. Saisonfilter, Rotationsstatistik, Einsatzzeiten, Aufschlagserien, Entwicklungsvergleiche und automatischer WVV-Spielplanimport fehlen noch. Spielbericht ist ein strukturierter JSON-Export. Keine echte iPhone-/Safari-Prüfung; das Layout wurde mit iPhone-Abmessungen im Browser geprüft. Vollständiger Offline-Start auf iOS bleibt am Gerät zu testen.

## Spieltage löschen und wiederherstellen
Unter Spieltage hat jede Partie einen Löschen-Button mit Bestätigung. Die App setzt ein `deletedAt`-Datum, statt die Partie aus der Datenbank zu entfernen. Papierkorb und Wiederherstellung befinden sich auf derselben Seite. Gelöschte Spiele zählen weder zu Statistiken noch zu Berichten und werden nicht im Live-Modus geöffnet. JSON-Backups enthalten sie weiterhin. Die bestehende revisionsgeprüfte Cloud-Funktion synchronisiert die Löschmarkierung und ihre Rücknahme; keine zusätzliche SQL-Migration erforderlich. Konflikte mit offline bearbeiteten Versionen werden weiterhin gemeldet, statt still Änderungen zu überschreiben. Es gibt keine endgültige Löschung.

## Neue Auswertung
Teamansicht mit erfassten Punkten, Kills, Fehlern, Zuspielen, Fehlerverteilung und Positionsdarstellung der Zuspiele. Spielertabellen haben Spaltengruppen für Überblick, positive Aktionen und Fehlerdetails, feste Namensspalte, Sortierung und CSV-Export. Filter für Saison (Juli–Juni), Spieltag und Satz gelten für Anzeige und Exporte. Ein separater Satzvergleich zeigt den Verlauf.
Fehleranteile beziehen sich ausschließlich auf alle erfassten Fehler. Echte Fehlerquoten pro Versuch werden nicht berechnet, weil vollständige Aufschlag-/Angriffsversuche fehlen. Historische Teamfehler bleiben unzugeordnet; fehlende Spielerwerte erscheinen als Gedankenstrich, unvollständige vorhandene Werte mit Stern. Nullwerte im Live-Protokoll bedeuten keine erfassten Aktionen, nicht notwendigerweise keine realen Aktionen. Problembereiche und auffällige Spielerzahlen beschreiben Anzahlen; ohne Einsätze und Versuche sind sie keine belastbaren individuellen Leistungsquoten.
