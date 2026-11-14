# Prüfung vom 14.11.2026

## Bestanden
- `node --test`: sechs Tests für historische Kontrollsummen und Import-Idempotenz, Altbestand ohne Mutation, stabile Event-IDs, Undo nach Serialisierung, Spielerwechsel mit eigenständigen Statistiken, Ablehnung ungültiger Daten und Service-Worker-Shell bei simuliert ausgefallenem Netzwerk.
- Syntaxprüfung von app.mjs und sw.js.
- GitHub Pages: Erstveröffentlichung über Actions erfolgreich; öffentliche App geladen.
- Browser an der veröffentlichten URL: neuen QA-Spieltag angelegt; David → Angriffsfehler erfasst; automatische Rückkehr zu sechs Spielerkacheln; Undo auch nach Neuladen; Jan → Devin auf derselben Kachel; Wechsel per Undo zurückgenommen.
- Sichtbare Auswertung: Rayan 16, Lukas 14, David 9, Jan/Slawa 7, Cedric 4, Devin 1, Lionel 0 Kills. 41 Zuspiele und 33 Teamfehler. Fehlende Werte ausdrücklich gekennzeichnet.
- Ansicht mit 390 × 844 geprüft und Live-Modus nach visueller Prüfung verdichtet.

## Noch nicht verifiziert
- Echtes iPhone, Safari und installierte iOS-PWA.
- Vollständiger Offline-Browserstart auf einem realen Gerät: Shell-/Netzausfall-Test ist eine Simulation.
- Migration mit tatsächlich auf dem persönlichen iPhone gespeicherten Daten; geprüft wurde ein repräsentativer Altbestand.
- Supabase-Schema gegen echte Datenbank/RLS: eigenes Projekt und Admin fehlen.

QA-Daten liegen ausschließlich im getrennten Browser-Testspeicher, nicht in einer Cloud oder im Code.

## Ergänzung: Cloud
- Insgesamt neun Tests bestanden, darunter Cloud-Konflikte, JSONB-Schlüsselreihenfolge, Änderungen während eines laufenden Abgleichs und gemockter Auth-/RPC-Transport einschließlich Undo-Markierung.
- Live-Projekt nach Benutzereinrichtung geprüft: rallyboard_matches, rallyboard_events und rallyboard_admins sind vorhanden und verweigern anonyme Lesezugriffe (HTTP 401 / 42501).
- Authentifizierter Ende-zu-Ende-Abgleich noch nicht geprüft: Benutzer muss sich selbst in der App anmelden. Keine Passwörter angefordert oder gespeichert.
- Zehn Tests bestanden nach zusätzlichem Regressionstest: heruntergeladene Spieltage und gespeicherter Sync-Vergleichsstand teilen keine veränderlichen Objekte.

## Spieltag-Papierkorb
- 14 automatische Tests bestanden. Zusätzliche Fälle: laufenden Spieltag entfernen, Neuladen, historische Aggregate ohne erneuten Import im Papierkorb behalten, sämtliche Originaldaten wiederherstellen, Lösch-/Wiederherstellungsmarkierungen im Cloud-Abgleich und Konflikt mit älteren Offline-Änderungen.

## Neu gestaltete Auswertung
- 18 automatische Tests bestanden. Neue Prüfungen: exakte historische Summen, keine erfundene Fehlerquote, Zuordnung von Spieler-/Teamfehlern, historische Sammelkategorien, Saison-/Satzfilter mit ursprünglicher Satznummer, ausgeschlossene Papierkorb-Einträge, CSV und Darstellung fehlender Werte.
- Papierkorb zusätzlich an der veröffentlichten App im isolierten Testspeicher geprüft: QA-Spiel löschen, neu laden, Papierkorb öffnen, wiederherstellen. Keine Änderungen an den tatsächlichen Benutzerdaten.
