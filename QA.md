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
- Veröffentlichte Auswertung zusätzlich im Browser geprüft: Teamansicht, Spielertabelle, MVP-Sortierung, Fehlerdetails, Satz-3-Filter (21 Kills / 16 erfasste Fehler / 14 Zuspiele). Bei 390 × 844 bleibt die Seite innerhalb der Bildschirmbreite; die Tabelle scrollt separat und hält die Namensspalte fest.

## Spieltag bearbeiten
- 20 automatische Tests bestanden. Neue Tests prüfen Gegner-/Datumsänderung an historischen beendeten Spielen bei stabiler ID, identischen Sätzen und Statistiken nach Neuladen sowie unveränderte Daten bei ungültigen Eingaben oder gelöschten Partien.

## Offizieller Spielplan und Teamzentrale
- 29 automatische Tests bestanden: 16 echte SG-Kaarst-Partien, korrekt ausgerichtete Ergebnisse/Orte/Uhrzeiten, importierte Wiederholungen ohne Duplikate, keine erfundenen Scouting-Sätze, manuelle Zuordnung bestehender Aggregate, Starten geplanter Spiele, Erhalt eigener Änderungen/Papierkorb, Erstabgleich auf zweitem Gerät, Berliner Tagesgrenze, CSV-Validierung und datierte Dashboard-Inhalte.
- Quellen: offizielle WVV-Spielplanseite mit Staffel-ID 116023057 sowie deren verlinkter CSV-/ICS-Export und die offizielle Tabelle. Stand 14.11.2026: SG Kaarst Platz 1, vier Spiele/vier Siege, 12 Punkte/12:0 Sätze. Nächster Termin 21.11.2026, 18:15 Uhr, DJK Tusa 06 Düsseldorf V; WVV weist auf möglichen späteren Beginn hin.
- An der veröffentlichten App im isolierten Browser geprüft: nächste Partie mit Uhrzeit und Verschiebungshinweis, offizielle Tabelle, Filter der Spieltagsverwaltung, explizite Verknüpfung der historischen Statistik mit ART Düsseldorf VI (58 Kills / 41 Zuspiele / 33 Teamfehler unverändert), Start der geplanten Partie gegen DJK Tusa 06 Düsseldorf V mit sechs Spielern in Satz 1. Bei 390 × 844 keine seitliche Überbreite, fünf Navigationspunkte sichtbar. Tatsächliche Benutzerdaten und Cloud wurden bei diesen Browser-Tests nicht verändert.

## Öffentliche Leseansicht, Admin-Schutz und vereinfachtes Tracking
- 37 automatische Tests bestanden: bestätigte Admin-Identität, Ablehnung normaler/abgemeldeter Benutzer, zeitlich begrenzte Offline-Freigabe, separater öffentlicher Cache, keine historischen Scouting-Werte als Besucher-Seed, keine Mutationskontrollen in öffentlichen Ansichten, explizite sechs Spieler je Satz, gesperrte Zukunftstermine, sichere Tracking-Archive und sichtbarer Papierkorb.
- Nach Ausführung von 004_public_read_only.sql am echten Projekt geprüft: öffentliches Lese-RPC HTTP 200, keine Account-/Owner-IDs, Tokens, privaten Tracking-Archive oder gelöschten Einträge in der Projektion. Direkte anonyme Zugriffe auf rallyboard_matches, rallyboard_events und rallyboard_admins weiterhin HTTP 401. Anonymer Aufruf der schreibenden Sync-Funktion weiterhin HTTP 401.
- Vereinslogo unverändert aus der bereitgestellten PNG-Datei übernommen. Oberfläche, Manifest und SVG-App-Symbol auf Blau/Weiß umgestellt.
- Gesten, Richtungsstatistiken und automatische Rotation bleiben wie mit dem Benutzer besprochen zurückgestellt. Das schnelle Spieler-/Aktionsbutton-Verfahren bleibt erhalten.

- Veröffentlichte öffentliche Oberfläche ohne Login im Browser geprüft: Team/Kader mit eingeklappter Admin-Anmeldung, Spielplan ohne Start-/Ändern-/Löschen-/Import-Kontrollen, schreibgeschützter Spielstand und echte Cloud-Auswertung (58 Kills / 33 erfasste Fehler). Keine privaten QA-Daten sichtbar.
- Blau-weiße Handyansicht bei 390 × 844 ohne seitlichen Seitenüberlauf, alle fünf Navigationspunkte sichtbar, keine Konsolenfehler. Kein echter iOS-Gerätetest und kein neuer authentifizierter Browser-Schreibtest.
- 38 Tests nach zusätzlicher Prüfung: fehlende historische Asse/Blocks auch im öffentlichen Spielstand als fehlend gekennzeichnet, beobachtete Live-Nullwerte bleiben Null.

## Korrektur der Zuspielposition
- Die bisherige Zuspielkategorie 5 heißt jetzt Position 2 Hinterfeld, getrennt von Position 2 am Netz. Historische Aggregate, Live-Ereignisse, öffentliche Ansicht und Cloud-Backups behalten ihren stabilen Schlüssel; es werden keine Zähler verschoben oder doppelt gezählt. Aufstellungszonen bleiben reguläre Feldpositionen.
- Auswertung zeigt den Hinterfeldangriff rechts hinten. Regression prüft 6 historische Zuspiele auf Position 2 Hinterfeld und 2 auf Position 2, Gesamtsumme weiterhin 41; gespeicherte Daten bleiben unverändert.

## Feature-Testlabor: Rotation und Swipe
- Eigenständiger Einstieg `lab.html`, nur auf Feature-Branch. Keine Produktionsmodule, Auth-Tokens, privaten Datenbanken oder Cloud-Schreiboperationen im Testlabor. Der bestehende Pages-Workflow wird nicht geändert; neuer Feature-Workflow testet ohne Deployment.
- 55 automatische Tests bestanden (39 bestehende plus 16 neue): explizite Aufstellung/Aufschlagwahl, vollständiger Rotationszyklus, Sideout versus Aufschlagserie, bestätigte versus offene Wischentwürfe, Kill und Zuspiel, Weiter ohne Punkt/Fehler, Netz-Aufschlagfehler, richtige Aufschläger/Vorderfeldblocker, Zielklassifikation, Position 2 Hinterfeld, Undo nach Neuladen einschließlich Rotation/Punkt/Zuspiel, manuelle Korrekturen, Auswechslung, Deduplizierung, neue Testsätze, Satzende und Speichertennung.
- Im lokalen Browser mit echten Pointer-Drags geprüft: Rayan von Position 4 ins gegnerische Feld (Longline-Vorschlag), vor Bestätigung 0:0; bestätigt 1:0, Kill +1, Zuspiel Position 4 +1, R2, Cedric neuer Aufschläger. Rückgängig stellt alles wieder her. Button-Alternative mit Weiter bleibt 0:0/R1.
- Bei 390 × 844 David hinter der Grundlinie zum Netz gezogen: Ins-Netz-Vorschlag, Punkt/Weiter gesperrt, vor Bestätigung kein Punkt. Nach Fehlerbestätigung 0:1 und genau ein Fehler bei David, kein Ass. Stand und Aktionsprotokoll nach Neuladen erhalten; keine Konsolenfehler.
- Wechsel Rayan → Devin am selben Rotationsplatz und Undo im Browser geprüft. Neue Satzaufstellung ist leer, Start ohne sechs Spieler und Aufschlagwahl deaktiviert. Seite und Dialog ohne horizontalen Seitenüberlauf. Kein physisches iPhone-/iPad-Gerät getestet.
- Test neu beginnen und Wiederherstellen im Browser geprüft: vorheriger Stand 0:1 samt Davids Netzfehler und Protokoll vollständig zurückgeholt. Anschließend QA-Ereignisse über Rückgängig entfernt; Vorschau bleibt mit ausdrücklich gewählter Aufstellung bei 0:0 bereit.

## V2: beide Teams, 5:1 und Kontaktketten
- 79 Tests insgesamt: 55 bestehende plus 24 V2-Fallgruppen. Neue Tests decken Aufschlagfehler mit Gegnerrotation, darauffolgenden Annahmefehler ohne erneute Rotation, komplette Kontaktketten mit Punkt/Weiter/Fehler, teilweise Ketten ohne erfundenen Folgetouch, ignorierte gerade Passanten, unzugeordnete gegnerische Rückbälle sowie korrigierbare Angriffspositionen ab.
- 5:1-Laufziele und Annahme–Zuspiel–Angriff-Kette in allen sechs Rotationen geprüft. Libero vor Vorderfeld/eigenem Aufschlag zurück, während Rally unverändert; Spielerstatistik bleibt beim tatsächlichen Libero. Beide vollständigen Rotationszyklen, gepaarte Rückwechsel, sechs Wechsel, zwei Auszeiten, Satzende mit zwei Punkten Abstand, erster Aufschlag im Folgesatz, Ziel 15 im fünften und Spielende nach drei Satzsiegen geprüft. Undo/Neuladen stellen beide Teams, Aufschläger, Libero und Kontaktstatistiken wieder her.
- CSS-Prüfung: dynamische kleine Viewport-Höhe, fester oberer Spielbereich, separater unterer Schutzbereich von mindestens 98px plus Safe-Area-Berücksichtigung, Dialoge oben. SVG und Spielerkoordinaten verwenden dieselbe normalisierte Fläche. Keine erneute Browser- oder echte iPhone-Bedienungsprüfung der V2; die älteren V1-Browsernachweise gelten dafür nicht.
- V2 eigener Speicherschlüssel; V1-Original bleibt erhalten. Keine produktiven Daten-, Login- oder Cloud-Module im neuen Controller.

## Kontextabhängige Notzuspiele und Annahmequalität
- 89 Tests bestanden, einschließlich zehn zusätzlicher Fallgruppen: zwei Hinterspieler → eigenes Aus, zweiter Kontakt übers Netz mit Punkt/Weiter, zweiter Angriff hinter Gegnergrundlinie ins Aus, Notzuspiel zum eigenen Angreifer, kompletter Spielzug mit Notzuspiel, reguläres Zuspiel/Notzuspiel ins Netz, äquivalente Teilgesten und vollständiges Undo/Neuladen.
- Bewertete ungenaue Annahme ist ein vor Bestätigung änderbarer Vorschlag und kein zusätzlicher Fehlerpunkt. Nicht bewerten und kontrolliert werden geprüft; unbestätigte Qualitätsfelder werden abgewiesen. Manuelle Kontaktkorrekturen bereinigen Notzuspiel-Labels, Nur-letzter-Kontakt entfernt die Bewertung einer verworfenen Annahme. Neue Tabellen-/Dialogtexte über reine Renderfunktionen geprüft.
- Gespiegelte Gegnerszenarien und Netzüberquerung erst nach dem letzten Kontakt geprüft. Eindeutige seitliche Übergabe an einen Hinterspieler funktioniert auch ohne deutliche Ecke; bei mehreren kollinearen Kandidaten wird keine zufällige Kontaktfolge gespeichert.
- Syntax und Importversionen geprüft; keine neue Browser-/physische iPhone-Bedienungsprüfung. Main und produktive Spieldaten bleiben unverändert.

## Vollständiges Testspiel und weitere Sätze
- 98 automatische Tests bestanden, darunter zwei vollständige Simulationsgruppen und sieben zusätzliche Regel-/Regressionsgruppen. Referenzspiel 3:1: 25:23, 22:25, 25:19, 28:26; 193 Ballwechsel, 458 Wischwege, 29 Undo-/Deduplizierungsprüfungen und 193 JSON-Neuladeprüfungen. 19 Szenariovarianten, darunter Netz-/Ausaufschlag, Ass, Annahmefehler, komplette/teilweise Kontaktketten, Notzuspiel ins Aus, direkter zweiter Ball, lange Rallys, Blockpunkt, Block/Folgekontakt, Sicherung nach Block, Überpass, fehlender Rückball, Block-out, Zuspielfehler und dritter Angriff ins Netz.
- Zusätzlich 24 reproduzierbare Sätze mit variierten Aufschlagserien, mit/ohne Libero: 1192 Ballwechsel, 2859 Wischwege, 176 Undo-Prüfungen. Insgesamt 1385 Ballwechsel und 3317 Wischwege. Beide Aufstellungen/Rotationen, Aufschlagrecht, Aufschläger und Libero werden nach jedem Ereignis gegen eine getrennte Erwartungsrechnung verglichen. Nach jedem Ballwechsel erfolgt JSON-Neuladen, nach jedem Satz die Abstimmung sämtlicher Punkte mit Spielerwerten, Gegnerfehlern und unzugeordneten Punkten. Je Satz Wechsel und Rückwechsel beider Teams sowie je eine Auszeit.
- Gefundene Produktfehler behoben: Blocker darf nächsten Ball spielen; Block kann auf Angreiferseite zurückkehren; Annahme-/Abwehrzähler bleiben bei direkten Rückbällen erhalten; Libero-Rückball als dritter Kontakt zulässig. Block-out benötigt explizite gegnerische Blockberührung. Neue Aufschlagblocks werden zurückgewiesen, vorhandene unversionierte Testereignisse bleiben ladbar. Fehler eines Empfangs-Rückballs wird keiner zweiten Fehlerkategorie zugerechnet.
- Regelabgleich: [offizielle FIVB-Regeln 2025–2028](https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN-v05.pdf), 14.4 (Block/Folgekontakt), 14.5 (Aufschlagblock) und 19.3.1.2 (Libero-Angriffshöhe). Die App kennt weder Ballhöhe noch Finger-/Baggertechnik und ersetzt keine Schiedsrichterentscheidung.
- Reproduzieren mit `node scripts/simulate-volleyball.mjs --report`; kompakter Bericht in `reports/volleyball-simulation.html`, `.md` und `.json`. Kein echter iPhone-/Browser-Bedienungstest in diesem Durchlauf. Synthetische Koordinaten durchlaufen echte Erkennung, Bestätigung und Ereignislogik; Testdaten bleiben vom App-Speicher und von Supabase getrennt. Main bleibt unverändert.
