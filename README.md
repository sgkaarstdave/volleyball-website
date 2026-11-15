# RallyBoard · SG Kaarst
Blau-weiße mobile Volleyball-App mit Vereinslogo, öffentlicher Teamzentrale und geschützter Administration. GitHub Pages, ohne Build-Abhängigkeiten.

## Feature-Test V2: 5:1 und Kontaktketten
Nur auf feature/rallyboard-improvements: lab.html ist der eigene Testbereich, veröffentlicht zusätzlich unter https://rallyboard-swipe-test.furrybeetle.chatgpt.site. Main und die normale GitHub-Pages-App bleiben unverändert. Die Veröffentlichung ist owner-privat; alle Testdaten bleiben im Browser.

Beide Teams erhalten eine Startaufstellung. SG Kaarst spielt 5:1 mit wählbarem Zuspieler, gegenüberliegenden Außen-/Mittel-/Diagonalrollen und optionalem Libero. Gegner werden durch Nummern dargestellt. Die ganze Startfolge kann für den gewünschten ersten Aufschläger gedreht werden. Danach werden Aufschlag, beide Rotationen, Satzende und nächster Satz geführt. In Satz 2–4 wechselt das erste Aufschlagrecht, im fünften wird neu gewählt. Drei gewonnene Sätze beenden das Testspiel.

Die Spielansicht zeigt die 5:1-Laufziele nach dem Aufschlag; die separate Rotationsansicht zeigt die gemeldete Reihenfolge. Die kleinen Ziffern bleiben immer die echten Rotationsplätze, auch wenn der Zuspieler an sein Laufziel geht. Es wird keine unbekannte individuelle Annahmetaktik eines Trainers behauptet.

Vom Aufschläger ins Netz/Aus: Fehlervorschlag bestätigen. Nach einem Gegneraufschlag genügt ein Tipp auf den eigenen Empfänger für einen Annahmefehlervorschlag. Ein durchgehender Weg vom Empfänger über Zuspieler und Angreifer ins gegnerische Feld ergibt eine atomare Kontaktkette. Die Abschlussfrage lautet Angriff erfolgreich? Ja zählt den Punkt, Nein lässt den Ballwechsel ohne Fehler weiterlaufen. Vorher durch den Weg belegte Kontakte zählen als weitergespielt, nicht als perfekte Annahmequalität. Endet der Weg beim Zuspieler, wird nur die Lieferung zu ihm gespeichert, nicht schon dessen nächster Kontakt. Geradlinig passierte Spieler werden nicht automatisch als weitere Kontakte gezählt. Fehlende gegnerische Rückbälle bleiben ohne Spielerzuordnung.

Liberoaustausche werden bei aktiver Option für Mittelspieler im Hinterfeld berechnet, niemals mitten im Ballwechsel geändert; vor Vorderfeld oder eigenem Aufschlag wird zurückgetauscht. Reguläre Wechsel prüfen sechs Wechsel und feste Rückwechselpaare. Auszeiten, manuelle Rotations-/Aufschlagkorrekturen, Satzprotokoll, JSON-Export und vollständiges Undo sind enthalten. Der Test ersetzt keinen offiziellen SAMS-Spielbericht mit Sanktionen, Verletzungswechseln oder allen Schiedsrichter-Sonderfällen. Orientierung: [SAMS Score Handbuch](https://wiki.sams-server.de/wiki/SAMS_Score/Handbuch) und [FIVB 2025–2028](https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN.pdf).

Die V2 verwendet ausschließlich rallyboard-rally-lab-v2. Vorhandene V1-Testdaten werden separat erhalten, bei Erststart als Legacy-Sicherung aufgenommen und nicht in echte Spiele übertragen. Neues Testen sichert den letzten V2-Stand. Kein Login-Client, keine Supabase-Aufrufe und kein Zugriff auf die private App-Datenbank. Die alten scout-Module bleiben als V1-Referenz mit Regressionstests erhalten.

Für iOS: kompakter, fester Feldbereich mit statischer unterer Schutzzone unter Berücksichtigung des Safe-Area-Abstands; kein Aufschlagspunkt liegt am Bildschirmrand. Dialoge öffnen oben. Systemgesten von iOS lassen sich durch eine Website nicht vollständig abschalten. Ein physischer iPhone-Test der neuen V2 ist noch nötig.

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

## Kontextabhängige zweite Kontakte
Die Erkennung prüft Kontaktzahl, Position im tatsächlichen Ballweg und Netzüberquerung nach dem letzten Spieler. Hinten → anderer Hinterspieler → eigenes/seitliches Aus wird als Notzuspiel-Fehler vorgeschlagen. Geht der zweite Kontakt über das Netz, wird ein direkter Angriff/Rückball vorgeschlagen. Ein zweiter Kontakt ins Netz bleibt zunächst ein Zuspiel-/Notzuspiel-Fehler; der Nutzer kann sichtbar auf Angriff umstellen. Ein zweiter Angriff über das Netz und hinter die gegnerische Grundlinie zählt dagegen als Angriffsfehler. Teilweise und vollständige Kontaktketten ergeben dieselben Zähler.

Die seitliche Weitergabe im Hinterfeld kann eine ungenaue Annahme vermuten lassen, beweist sie aber nicht. Der Dialog zeigt eine ausdrücklich änderbare Bewertung (vermutlich ungenau / kontrolliert bzw. gewollt / nicht bewerten). Erst die Abschlussbestätigung speichert die gewählte Qualität. Ungenaue Annahmen zählen getrennt von punktentscheidenden Fehlern; Notzuspiele und deren Fehler haben eigene Zähler. Bekannte Alt-Ereignisse bleiben unverändert, neue Erkennungsregeln gelten nur für neue Eingaben. Bei mehreren unklar auf einer Geraden berührten Hinterspielern wird um einen kurzen Halt/Richtungswechsel gebeten, statt beliebige Kontakte zu erfinden.

## Vollständige Spielsimulation
`node scripts/simulate-volleyball.mjs --report` spielt reproduzierbar ein erfundenes 3:1 durch: 25:23, 22:25, 25:19 und 28:26. Die 193 Ballwechsel enthalten 458 koordinatenbasierte Wischwege und 19 benannte Szenariovarianten. Zusätzlich laufen 24 Sätze mit 1192 Ballwechseln, wechselnden Aufschlagserien und mit/ohne Libero. `reports/volleyball-simulation.html` zeigt Ergebnisse, Spielerwerte und jeden Ballwechsel; JSON und Markdown enthalten denselben Nachweis. Die Berichte ändern keine App-Speicherdaten.

Spielstand, beide Rotationsfolgen, Aufschläger und Libero werden nach jedem Ereignis gegen eine eigene Erwartungsrechnung geprüft. Nach jedem Ballwechsel wird JSON gespeichert/neugeladen; nach jedem Satz müssen Spielerpunkte, gegnerische Fehler und unzugeordnete Punkte den Spielstand erklären. Regelmäßiges Undo und Deduplizieren sind enthalten. Die Simulation ruft die echten Erkennungs-/Bestätigungs-/Speicherfunktionen mit synthetischen Koordinaten auf; echte Touchbedienung, Dialog-Klickabläufe und iOS-Systemgesten sind damit nicht getestet.

Dabei korrigiert: Der Blockspieler darf den nächsten Kontakt übernehmen, ein weiterlaufender Block kann auf beiden Ballseiten landen und verbraucht keinen der drei Mannschaftskontakte. Nach „Ball läuft weiter“ ergibt sich die Ballseite aus dem nächsten erfassten Kontakt. Ein Angriff ins Aus kann nur mit ausdrücklich bestätigter gegnerischer Blockberührung als Block-out zählen. Direkt aus Annahme/Abwehr zurückgespielte Bälle behalten ihre Empfangswerte; ihre Fehler zählen einmal. Der Libero kann den dritten Kontakt als Rückball spielen. Ballhöhe und Kontakttechnik sind aus einer 2D-Linie nicht erkennbar und werden nicht als regelgerecht bewiesen.

Neue Ereignisse tragen `rulesVersion: 2` und verbieten zusätzlich das Blocken eines Aufschlags. Vorhandene unversionierte V2-Testereignisse bleiben lesbar und unverändert. Grundlage: [FIVB-Regeln 2025–2028](https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN-v05.pdf), 14.4, 14.5 und 19.3.1.2. Alle Änderungen betreffen ausschließlich das Feature-Testlabor.
