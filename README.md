# RallyBoard · SG Kaarst
Blau-weiße mobile Volleyball-App mit Vereinslogo, öffentlicher Teamzentrale und geschützter Administration. GitHub Pages, ohne Build-Abhängigkeiten.

## Feature-Test: Rotation und Wischgesten
Auf `feature/rallyboard-improvements` gibt es einen eigenständigen Prototyp unter `lab.html`. Start: `node preview.mjs`, dann http://127.0.0.1:4173/lab.html öffnen. Die reguläre App und der Branch `main` werden dafür nicht verändert. Der Feature-Workflow führt nur Tests aus; er veröffentlicht keine Website. Erst eine ausdrücklich beschlossene Übernahme soll den Prototyp mit der produktiven App verbinden.

Vor jedem Testsatz werden sechs Spieler und das erste Aufschlagrecht gewählt. Das Feld zeigt Rotationsplätze und den aktuellen Aufschläger. Bei eigenem Punktgewinn aus gegnerischem Aufschlag wird im Uhrzeigersinn rotiert (2 → 1 → 6 → 5 → 4 → 3 → 2), bei eigener Aufschlagserie nicht. Grundlage: [FIVB-Regeln 2025–2028, 7.6.2](https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN.pdf). Korrekturen und Wechsel bleiben manuell möglich; Libero-Automatik, taktische Laufwege und Wechselbegrenzungen sind noch nicht umgesetzt.

Aktionsart auswählen (Angriff, Aufschlag, Annahme, Abwehr, Block), vom Spieler zum Ziel ziehen und das Ergebnis bestätigen. Alternativ Spieler antippen und Buttons verwenden. Angriff/Aufschlag/Block bieten Punkt, Weiter und Fehler; Annahme/Abwehr bieten Gut, Weiter und Fehler. Eine Wischbewegung allein zählt nichts. Netz/Aus liefern Fehlervorschläge, keine automatische Fehlerbuchung. Richtung wird nur grob aus der Linie vorgeschlagen. Ein normal weitergespielter Ball wird nicht als Fehler behandelt.

Ein Kill kann ein Zuspiel zur gewählten Angriffsposition mitbuchen. Der Angriffsort lässt sich vor der Bestätigung ändern; ein Häkchen verhindert bei direktem Rückspiel ein erfundenes Zuspiel. Rotation und tatsächlicher Angriffsort bleiben getrennt. Position 2 Hinterfeld ist eine eigene Kategorie. Rückgängig nimmt Spieleraktion, Punkt, Aufschlagwechsel, Rotation und eventuelle Zuspielzählung gemeinsam zurück. Testsätze enden bei 25 (fünfter Satz 15) mit zwei Punkten Vorsprung; bewusst früher gestartete neue Testsätze behalten die bisherigen Daten.

Alle Testdaten liegen ausschließlich unter `rallyboard-scout-lab-v1` im lokalen Browser-Speicher. Es gibt keinen Cloud-Client, kein Admin-Login, keine Supabase-Aufrufe und keinen Zugriff auf den privaten IndexedDB-Speicher. Neues Testen sichert den vorherigen Test unter einem separaten Schlüssel; die letzte Sicherung kann zurückgeholt werden. JSON-Export ist möglich. Speicherfehler werden angezeigt, Änderungen erst nach erfolgreichem Speichern übernommen. Der Stand überlebt Neuladen; parallele Tabs erkennen Änderungen. Die Vorschau benötigt einen laufenden lokalen Server und wird nicht als eigene Offline-PWA installiert.

## Für Zuschauer
Die App öffnet ohne Anmeldung. Startseite, Spielplan, Kader, Satzstände und freigegebene Statistiken sind lesbar. Kein Tracking, Bearbeiten, Löschen, Import oder Einstellungsänderungen. Die Anmeldung ist unter Team eingeklappt. Der App-Link enthält keine Zugangsdaten und kann in WhatsApp geteilt werden.
Die App lädt einen öffentlichen Datenstand alle 30 Sekunden und beim Zurückkehren ins Fenster nach. Bereits geladene Daten werden separat offline zwischengespeichert. Offizielle Verbandsdaten sind als datierter WVV-Stand gekennzeichnet.

## Für Admins
Team → Admin-Anmeldung. Nur serverseitig in rallyboard_admins freigeschaltete Benutzer werden als Admin bestätigt. Eine bestätigte Sitzung erlaubt lokal das Bearbeiten und Tracking. Online ist ein gültiger Sitzungstoken erforderlich; offline bleibt eine zuvor bestätigte Sitzung maximal 24 Stunden lokal nutzbar. Tokens liegen im sessionStorage des App-Fensters; Passwörter werden nie gespeichert. Nach Abmelden oder Schließen kann eine erneute Anmeldung nötig sein.
Der zentrale lokale Schreibpfad und der Cloud-Sync prüfen die Admin-Freigabe. Die eigentliche Schreibsicherheit der Cloud liegt zusätzlich in Supabase RLS und der geschützten Sync-Funktion. Das öffentliche Lese-RPC besitzt keine Schreiboperationen. Die privaten Tabellen bleiben für anon gesperrt.

## Aufstellung, Tracking und Wiederherstellung
Vor dem ersten Satz müssen sechs unterschiedliche Spieler und ihre Positionen ausgewählt werden. Niemand wird automatisch aufgestellt. Jeder neue Satz öffnet erneut eine leere Aufstellung; die vorige kann ausdrücklich übernommen werden. Erfolgreiche Aktionen und Fehler werden weiterhin über große Spieler-/Aktionsbuttons erfasst. Gesten, Schlagrichtungen und Rotationsauswertungen sind vorerst zurückgestellt.
Tracking ist nur am Spieltag oder rückwirkend möglich. Zukünftige Termine sind gesperrt, auch wenn sie in einer älteren App-Version bereits vorzeitig gestartet wurden. Solche Daten bleiben erhalten und können zurückgesetzt oder später fortgeführt werden.
Spieltage → Papierkorb zeigt gelöschte Partien direkt über einen eigenen Filter. Wiederherstellen erhält alle Sätze und Statistiken. Direkt nach dem Löschen ist zusätzlich Rückgängig verfügbar.
Verwalten → Tracking zurücksetzen archiviert alle bisherigen Sätze im Spieltag und lässt den Termin bestehen. Die Sicherung lässt sich unter Tracking-Daten wiederherstellen zurückholen. Neue aktive Satzdaten werden dabei nicht überschrieben. Es gibt keine endgültige Datenlöschung.

## Daten, Migration und Auswertung
IndexedDB rallyboard-v2 speichert private Admin-Daten unter app und den öffentlichen Cache unter public-board. Zuschauer sehen weder ungesendete Admin-Änderungen noch den privaten Papierkorb oder Tracking-Archive. Logout ersetzt die privaten Daten nicht durch die öffentliche Projektion.
Migration aus localStorage rallyboard-v1 verändert dessen Original nicht und archiviert es zusätzlich unter legacy-original. Speicherfehler ersetzen keine vorhandenen privaten Daten. Regelmäßig JSON-Backups herunterladen; iOS kann Browserdaten löschen. Safari und installierte PWA können getrennte Speicher haben. Paralleles Tracking in mehreren Tabs ist nicht unterstützt.
Der historische Import vom 14.11.2026 bleibt idempotent: 58 Kills, 41 Zuspiele und 33 bekannte Teamfehler als Satzaggregate. Keine erfundenen Live-Ereignisse. Fehlende Werte erscheinen als Gedankenstrich, unvollständige Werte mit Stern. Historische Teamfehler werden keinen Spielern zugeschrieben.
Team-, Spieler- und Satzvergleich lassen sich nach Saison, Spieltag und Satz filtern. Fehleranteile beziehen sich auf erfasste Fehler. Echte Erfolgs-/Fehlerquoten werden ohne vollständige Versuche nicht behauptet. CSV- und JSON-Auswertungen berücksichtigen die Filter.

## Supabase
Ausschließlich eigenes Projekt odghcjkznmxaeqlrvtbs; MiSai Hub wird nicht verwendet. Nur öffentlicher Publishable-Key im Frontend.
- 001_rallyboard.sql: private Tabellen, Admin-Mitgliedschaft und RLS.
- 002_sync.sql: atomarer Sync mit Revisionsprüfung und stabilen Event-IDs.
- 003_admin_user_deletion.sql: Korrektur für bestehende Installationen, um ungenutzte Auth-Benutzer samt Admin-Verknüpfung löschen zu können; Spielstände bleiben durch ihre Eigentümerverweise geschützt.
- 004_public_read_only.sql: vom Benutzer ausgeführt. Öffentliches Lese-RPC mit expliziter Projektion: aktive Spieltage, Kader und Statistiken. Keine Account-/Owner-IDs, Login-Tokens, Admin-Mitgliedschaft, gelöschten Spiele, Tracking-Archive oder internen Event-IDs. Die privaten Tabellen werden nicht pauschal öffentlich lesbar.
Stabile UUIDs, Undo-Markierungen und Revisionen verhindern doppelte Ereignisse und stilles Überschreiben konkurrierender Änderungen. Neue lokale Aktionen während eines laufenden Sync bleiben erhalten.

## WVV
Verifizierter Spielplan der Bezirksklasse 16 Männer 2026/27, Staffel-ID 116023057, Stand 14.11.2026: 16 SG-Kaarst-Partien. Referee-only Partien sind ausgeschlossen. Ergebnisse, Hallen, Gastgeber und gekennzeichnete mögliche Verzögerungen werden übernommen. Offizielle Ergebnisse erzeugen keine Scouting-Sätze oder Spielerwerte.
Bei gleichem Datum und exakt gleichem Gegner kann vorhandenes Scouting zugeordnet werden. Unbekannte Gegner benötigen eine ausdrückliche Zuordnung über Spieldetails. IDs und Sätze bleiben erhalten.
Admins können den offiziellen CSV-Export unter Spieltage → WVV-CSV importieren einlesen. Eigene Änderungen und Papierkorb bleiben erhalten. Die offizielle Tabelle bleibt ein ausgewiesener Snapshot; CSV aktualisiert nur den Spielplan. Entwickler können node scripts/refresh-wvv.mjs ausführen und nach Prüfung eine neue Asset-Version veröffentlichen.

## Entwicklung und Prüfung
node --test führt die Regressionstests aus. node preview.mjs startet die lokale Vorschau. GitHub Actions testet und veröffentlicht die statischen Dateien. Alle Ressourcen berücksichtigen den Repository-Unterpfad.
Browserprüfung ergänzt Tests; ein echtes iPhone/iOS-Gerät und ein vollständiger Offline-PWA-Start müssen am Gerät geprüft werden. Offline-Shell und Netzfehler sind zusätzlich simuliert getestet. Admin-Sitzungen und RLS werden nicht durch ein öffentliches Test-/Demo-Login umgangen.
