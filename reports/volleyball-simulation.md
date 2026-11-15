# RallyBoard · Simulation eines vollständigen Testspiels

Automatische Simulation über dieselbe Kontakt- und Gestenerkennung wie die App. Kein echter iPhone-Bedienungstest. Keine echten Spiele verändert.

Ergebnis: **3:1** · Sätze **25:23, 22:25, 25:19, 28:26** · **193 Ballwechsel**.
458 Wischweg-Prüfungen · 29 Undo-/Deduplizierungsprüfungen · 193 Speichern-/Neuladenprüfungen.
24 zusätzliche Sätze · 1192 Ballwechsel · 2859 Wischwege.

Nach jedem Ereignis: Spielstand, beide Rotationsfolgen, Aufschläger, sechs verschiedene Feldspieler und Libero gegen eine getrennte Erwartungsrechnung geprüft. Nach jedem Ballwechsel: JSON speichern/neuladen. Nach jedem Satz: Statistiken mit dem Spielstand abgleichen.

Reproduzierbar: node scripts/simulate-volleyball.mjs --report · Seed 20261115.

## Abgedeckte Spielsituationen

- Ass: 8×
- Annahmefehler nach unprotokolliertem Aufschlag: 6×
- Annahme–Zuspiel–Angriff ins Aus: 6×
- Notzuspiel im Hinterfeld ins Aus: 13×
- Direkter zweiter Ball: 13×
- Teilgesten: Annahme, Zuspiel und Angriff: 13×
- Langer Ballwechsel mit mehreren abgewehrten Angriffen: 12×
- Direkter Blockpunkt: 12×
- Block und erster Folgekontakt durch denselben Spieler: 12×
- Angriff geblockt, Sicherung auf Angreiferseite und neuer Angriff: 12×
- Überpass / direkter Annahme-Rückball und Gegenangriff: 12×
- Verpasster gegnerischer Rückball ohne erfundene Spielerwerte: 12×
- Block-out nach bestätigter gegnerischer Blockberührung: 11×
- Zuspiel-/Technikfehler: 11×
- Dritter Kontakt als Angriff ins Netz: 11×
- Punkt ohne Spielerzuordnung bei verpasstem Ballwechsel: 10×
- Aufschlag ins Netz: 5×
- Aufschlag ins Aus: 7×
- Annahme–Zuspiel–Kill: 7×

## Spielverlauf

| Satz | Ballwechsel | Ergebnis danach | Punkt | Neuer Aufschläger | Szenario |
|---|---:|---|---|---|---|
| 1 | 1 | 1:0 | SG Kaarst | David | Ass |
| 1 | 2 | 2:0 | SG Kaarst | David | Annahmefehler nach unprotokolliertem Aufschlag |
| 1 | 3 | 3:0 | SG Kaarst | David | Annahme–Zuspiel–Angriff ins Aus |
| 1 | 4 | 3:1 | Gegner | G2 | Notzuspiel im Hinterfeld ins Aus |
| 1 | 5 | 4:1 | SG Kaarst | Cedric | Direkter zweiter Ball |
| 1 | 6 | 4:2 | Gegner | G3 | Teilgesten: Annahme, Zuspiel und Angriff |
| 1 | 7 | 4:3 | Gegner | G3 | Langer Ballwechsel mit mehreren abgewehrten Angriffen |
| 1 | 8 | 4:4 | Gegner | G3 | Direkter Blockpunkt |
| 1 | 9 | 5:4 | SG Kaarst | Slawa | Block und erster Folgekontakt durch denselben Spieler |
| 1 | 10 | 6:4 | SG Kaarst | Slawa | Angriff geblockt, Sicherung auf Angreiferseite und neuer Angriff |
| 1 | 11 | 6:5 | Gegner | G4 | Überpass / direkter Annahme-Rückball und Gegenangriff |
| 1 | 12 | 7:5 | SG Kaarst | Rayan | Verpasster gegnerischer Rückball ohne erfundene Spielerwerte |
| 1 | 13 | 8:5 | SG Kaarst | Rayan | Block-out nach bestätigter gegnerischer Blockberührung |
| 1 | 14 | 8:6 | Gegner | G5 | Zuspiel-/Technikfehler |
| 1 | 15 | 9:6 | SG Kaarst | Lukas | Dritter Kontakt als Angriff ins Netz |
| 1 | 16 | 9:7 | Gegner | G6 | Punkt ohne Spielerzuordnung bei verpasstem Ballwechsel |
| 1 | 17 | 10:7 | SG Kaarst | Jan | Aufschlag ins Netz |
| 1 | 18 | 11:7 | SG Kaarst | Jan | Annahmefehler nach unprotokolliertem Aufschlag |
| 1 | 19 | 12:7 | SG Kaarst | Jan | Annahme–Zuspiel–Angriff ins Aus |
| 1 | 20 | 12:8 | Gegner | G1 | Notzuspiel im Hinterfeld ins Aus |
| 1 | 21 | 12:9 | Gegner | G1 | Direkter zweiter Ball |
| 1 | 22 | 12:10 | Gegner | G1 | Teilgesten: Annahme, Zuspiel und Angriff |
| 1 | 23 | 13:10 | SG Kaarst | David | Langer Ballwechsel mit mehreren abgewehrten Angriffen |
| 1 | 24 | 14:10 | SG Kaarst | David | Direkter Blockpunkt |
| 1 | 25 | 14:11 | Gegner | G2 | Block und erster Folgekontakt durch denselben Spieler |
| 1 | 26 | 15:11 | SG Kaarst | Cedric | Angriff geblockt, Sicherung auf Angreiferseite und neuer Angriff |
| 1 | 27 | 16:11 | SG Kaarst | Cedric | Überpass / direkter Annahme-Rückball und Gegenangriff |
| 1 | 28 | 16:12 | Gegner | G3 | Verpasster gegnerischer Rückball ohne erfundene Spielerwerte |
| 1 | 29 | 17:12 | SG Kaarst | Slawa | Block-out nach bestätigter gegnerischer Blockberührung |
| 1 | 30 | 18:12 | SG Kaarst | Slawa | Zuspiel-/Technikfehler |
| 1 | 31 | 18:13 | Gegner | G4 | Dritter Kontakt als Angriff ins Netz |
| 1 | 32 | 18:14 | Gegner | G4 | Punkt ohne Spielerzuordnung bei verpasstem Ballwechsel |
| 1 | 33 | 18:15 | Gegner | G4 | Ass |
| 1 | 34 | 19:15 | SG Kaarst | Rayan | Aufschlag ins Aus |
| 1 | 35 | 19:16 | Gegner | G5 | Annahme–Zuspiel–Kill |
| 1 | 36 | 19:17 | Gegner | G5 | Notzuspiel im Hinterfeld ins Aus |
| 1 | 37 | 19:18 | Gegner | G5 | Direkter zweiter Ball |
| 1 | 38 | 20:18 | SG Kaarst | Lukas | Teilgesten: Annahme, Zuspiel und Angriff |
| 1 | 39 | 21:18 | SG Kaarst | Lukas | Langer Ballwechsel mit mehreren abgewehrten Angriffen |
| 1 | 40 | 21:19 | Gegner | G6 | Direkter Blockpunkt |
| 1 | 41 | 21:20 | Gegner | G6 | Block und erster Folgekontakt durch denselben Spieler |
| 1 | 42 | 22:20 | SG Kaarst | Jan | Angriff geblockt, Sicherung auf Angreiferseite und neuer Angriff |
| 1 | 43 | 22:21 | Gegner | G1 | Überpass / direkter Annahme-Rückball und Gegenangriff |
| 1 | 44 | 22:22 | Gegner | G1 | Verpasster gegnerischer Rückball ohne erfundene Spielerwerte |
| 1 | 45 | 23:22 | SG Kaarst | David | Block-out nach bestätigter gegnerischer Blockberührung |
| 1 | 46 | 23:23 | Gegner | G2 | Zuspiel-/Technikfehler |
| 1 | 47 | 24:23 | SG Kaarst | Cedric | Dritter Kontakt als Angriff ins Netz |
| 1 | 48 | 25:23 | SG Kaarst | Cedric | Punkt ohne Spielerzuordnung bei verpasstem Ballwechsel |
| 2 | 1 | 1:0 | SG Kaarst | Slawa | Aufschlag ins Netz |
| 2 | 2 | 2:0 | SG Kaarst | Slawa | Annahmefehler nach unprotokolliertem Aufschlag |
| 2 | 3 | 3:0 | SG Kaarst | Slawa | Annahme–Zuspiel–Angriff ins Aus |
| 2 | 4 | 3:1 | Gegner | G4 | Notzuspiel im Hinterfeld ins Aus |
| 2 | 5 | 4:1 | SG Kaarst | Rayan | Direkter zweiter Ball |
| 2 | 6 | 4:2 | Gegner | G5 | Teilgesten: Annahme, Zuspiel und Angriff |
| 2 | 7 | 4:3 | Gegner | G5 | Langer Ballwechsel mit mehreren abgewehrten Angriffen |
| 2 | 8 | 5:3 | SG Kaarst | Lukas | Direkter Blockpunkt |
| 2 | 9 | 5:4 | Gegner | G6 | Block und erster Folgekontakt durch denselben Spieler |
| 2 | 10 | 6:4 | SG Kaarst | Dave | Angriff geblockt, Sicherung auf Angreiferseite und neuer Angriff |
| 2 | 11 | 6:5 | Gegner | G1 | Überpass / direkter Annahme-Rückball und Gegenangriff |
| 2 | 12 | 6:6 | Gegner | G1 | Verpasster gegnerischer Rückball ohne erfundene Spielerwerte |
| 2 | 13 | 7:6 | SG Kaarst | David | Block-out nach bestätigter gegnerischer Blockberührung |
| 2 | 14 | 7:7 | Gegner | G2 | Zuspiel-/Technikfehler |
| 2 | 15 | 7:8 | Gegner | G2 | Dritter Kontakt als Angriff ins Netz |
| 2 | 16 | 8:8 | SG Kaarst | Cedric | Punkt ohne Spielerzuordnung bei verpasstem Ballwechsel |
| 2 | 17 | 9:8 | SG Kaarst | Cedric | Ass |
| 2 | 18 | 9:9 | Gegner | G3 | Aufschlag ins Aus |
| 2 | 19 | 9:10 | Gegner | G3 | Annahme–Zuspiel–Angriff ins Aus |
| 2 | 20 | 9:11 | Gegner | G3 | Notzuspiel im Hinterfeld ins Aus |
| 2 | 21 | 10:11 | SG Kaarst | Slawa | Direkter zweiter Ball |
| 2 | 22 | 11:11 | SG Kaarst | Slawa | Teilgesten: Annahme, Zuspiel und Angriff |
| 2 | 23 | 12:11 | SG Kaarst | Slawa | Langer Ballwechsel mit mehreren abgewehrten Angriffen |
| 2 | 24 | 12:12 | Gegner | G4 | Direkter Blockpunkt |
| 2 | 25 | 13:12 | SG Kaarst | Rayan | Block und erster Folgekontakt durch denselben Spieler |
| 2 | 26 | 14:12 | SG Kaarst | Rayan | Angriff geblockt, Sicherung auf Angreiferseite und neuer Angriff |
| 2 | 27 | 14:13 | Gegner | G5 | Überpass / direkter Annahme-Rückball und Gegenangriff |
| 2 | 28 | 14:14 | Gegner | G5 | Verpasster gegnerischer Rückball ohne erfundene Spielerwerte |
| 2 | 29 | 14:15 | Gegner | G5 | Block-out nach bestätigter gegnerischer Blockberührung |
| 2 | 30 | 15:15 | SG Kaarst | Lukas | Zuspiel-/Technikfehler |
| 2 | 31 | 16:15 | SG Kaarst | Lukas | Dritter Kontakt als Angriff ins Netz |
| 2 | 32 | 16:16 | Gegner | G6 | Punkt ohne Spielerzuordnung bei verpasstem Ballwechsel |
| 2 | 33 | 16:17 | Gegner | G6 | Ass |
| 2 | 34 | 16:18 | Gegner | G6 | Annahmefehler nach unprotokolliertem Aufschlag |
| 2 | 35 | 17:18 | SG Kaarst | Jan | Annahme–Zuspiel–Kill |
| 2 | 36 | 18:18 | SG Kaarst | Jan | Notzuspiel im Hinterfeld ins Aus |
| 2 | 37 | 18:19 | Gegner | G1 | Direkter zweiter Ball |
| 2 | 38 | 18:20 | Gegner | G1 | Teilgesten: Annahme, Zuspiel und Angriff |
| 2 | 39 | 18:21 | Gegner | G1 | Langer Ballwechsel mit mehreren abgewehrten Angriffen |
| 2 | 40 | 19:21 | SG Kaarst | David | Direkter Blockpunkt |
| 2 | 41 | 20:21 | SG Kaarst | David | Block und erster Folgekontakt durch denselben Spieler |
| 2 | 42 | 21:21 | SG Kaarst | David | Angriff geblockt, Sicherung auf Angreiferseite und neuer Angriff |
| 2 | 43 | 21:22 | Gegner | G2 | Überpass / direkter Annahme-Rückball und Gegenangriff |
| 2 | 44 | 22:22 | SG Kaarst | Cedric | Verpasster gegnerischer Rückball ohne erfundene Spielerwerte |
| 2 | 45 | 22:23 | Gegner | G3 | Block-out nach bestätigter gegnerischer Blockberührung |
| 2 | 46 | 22:24 | Gegner | G3 | Zuspiel-/Technikfehler |
| 2 | 47 | 22:25 | Gegner | G3 | Dritter Kontakt als Angriff ins Netz |
| 3 | 1 | 1:0 | SG Kaarst | Slawa | Ass |
| 3 | 2 | 1:1 | Gegner | G6 | Aufschlag ins Aus |
| 3 | 3 | 2:1 | SG Kaarst | Rayan | Annahme–Zuspiel–Kill |
| 3 | 4 | 2:2 | Gegner | G1 | Notzuspiel im Hinterfeld ins Aus |
| 3 | 5 | 3:2 | SG Kaarst | Lukas | Direkter zweiter Ball |
| 3 | 6 | 4:2 | SG Kaarst | Lukas | Teilgesten: Annahme, Zuspiel und Angriff |
| 3 | 7 | 4:3 | Gegner | G2 | Langer Ballwechsel mit mehreren abgewehrten Angriffen |
| 3 | 8 | 4:4 | Gegner | G2 | Direkter Blockpunkt |
| 3 | 9 | 5:4 | SG Kaarst | Dave | Block und erster Folgekontakt durch denselben Spieler |
| 3 | 10 | 6:4 | SG Kaarst | Dave | Angriff geblockt, Sicherung auf Angreiferseite und neuer Angriff |
| 3 | 11 | 7:4 | SG Kaarst | Dave | Überpass / direkter Annahme-Rückball und Gegenangriff |
| 3 | 12 | 7:5 | Gegner | G3 | Verpasster gegnerischer Rückball ohne erfundene Spielerwerte |
| 3 | 13 | 8:5 | SG Kaarst | David | Block-out nach bestätigter gegnerischer Blockberührung |
| 3 | 14 | 9:5 | SG Kaarst | David | Zuspiel-/Technikfehler |
| 3 | 15 | 10:5 | SG Kaarst | David | Dritter Kontakt als Angriff ins Netz |
| 3 | 16 | 10:6 | Gegner | G4 | Punkt ohne Spielerzuordnung bei verpasstem Ballwechsel |
| 3 | 17 | 10:7 | Gegner | G4 | Ass |
| 3 | 18 | 10:8 | Gegner | G4 | Annahmefehler nach unprotokolliertem Aufschlag |
| 3 | 19 | 11:8 | SG Kaarst | Cedric | Annahme–Zuspiel–Kill |
| 3 | 20 | 12:8 | SG Kaarst | Cedric | Notzuspiel im Hinterfeld ins Aus |
| 3 | 21 | 13:8 | SG Kaarst | Cedric | Direkter zweiter Ball |
| 3 | 22 | 13:9 | Gegner | G5 | Teilgesten: Annahme, Zuspiel und Angriff |
| 3 | 23 | 14:9 | SG Kaarst | Slawa | Langer Ballwechsel mit mehreren abgewehrten Angriffen |
| 3 | 24 | 15:9 | SG Kaarst | Slawa | Direkter Blockpunkt |
| 3 | 25 | 16:9 | SG Kaarst | Slawa | Block und erster Folgekontakt durch denselben Spieler |
| 3 | 26 | 16:10 | Gegner | G6 | Angriff geblockt, Sicherung auf Angreiferseite und neuer Angriff |
| 3 | 27 | 16:11 | Gegner | G6 | Überpass / direkter Annahme-Rückball und Gegenangriff |
| 3 | 28 | 17:11 | SG Kaarst | Rayan | Verpasster gegnerischer Rückball ohne erfundene Spielerwerte |
| 3 | 29 | 18:11 | SG Kaarst | Rayan | Block-out nach bestätigter gegnerischer Blockberührung |
| 3 | 30 | 19:11 | SG Kaarst | Rayan | Zuspiel-/Technikfehler |
| 3 | 31 | 19:12 | Gegner | G1 | Dritter Kontakt als Angriff ins Netz |
| 3 | 32 | 20:12 | SG Kaarst | Lukas | Punkt ohne Spielerzuordnung bei verpasstem Ballwechsel |
| 3 | 33 | 21:12 | SG Kaarst | Lukas | Ass |
| 3 | 34 | 21:13 | Gegner | G2 | Aufschlag ins Aus |
| 3 | 35 | 21:14 | Gegner | G2 | Annahme–Zuspiel–Angriff ins Aus |
| 3 | 36 | 21:15 | Gegner | G2 | Notzuspiel im Hinterfeld ins Aus |
| 3 | 37 | 22:15 | SG Kaarst | Jan | Direkter zweiter Ball |
| 3 | 38 | 22:16 | Gegner | G3 | Teilgesten: Annahme, Zuspiel und Angriff |
| 3 | 39 | 22:17 | Gegner | G3 | Langer Ballwechsel mit mehreren abgewehrten Angriffen |
| 3 | 40 | 23:17 | SG Kaarst | David | Direkter Blockpunkt |
| 3 | 41 | 23:18 | Gegner | G4 | Block und erster Folgekontakt durch denselben Spieler |
| 3 | 42 | 23:19 | Gegner | G4 | Angriff geblockt, Sicherung auf Angreiferseite und neuer Angriff |
| 3 | 43 | 24:19 | SG Kaarst | Cedric | Überpass / direkter Annahme-Rückball und Gegenangriff |
| 3 | 44 | 25:19 | SG Kaarst | Cedric | Verpasster gegnerischer Rückball ohne erfundene Spielerwerte |
| 4 | 1 | 1:0 | SG Kaarst | Lukas | Aufschlag ins Netz |
| 4 | 2 | 1:1 | Gegner | G2 | Aufschlag ins Aus |
| 4 | 3 | 2:1 | SG Kaarst | Jan | Annahme–Zuspiel–Kill |
| 4 | 4 | 2:2 | Gegner | G3 | Notzuspiel im Hinterfeld ins Aus |
| 4 | 5 | 3:2 | SG Kaarst | David | Direkter zweiter Ball |
| 4 | 6 | 4:2 | SG Kaarst | David | Teilgesten: Annahme, Zuspiel und Angriff |
| 4 | 7 | 5:2 | SG Kaarst | David | Langer Ballwechsel mit mehreren abgewehrten Angriffen |
| 4 | 8 | 5:3 | Gegner | G4 | Direkter Blockpunkt |
| 4 | 9 | 5:4 | Gegner | G4 | Block und erster Folgekontakt durch denselben Spieler |
| 4 | 10 | 5:5 | Gegner | G4 | Angriff geblockt, Sicherung auf Angreiferseite und neuer Angriff |
| 4 | 11 | 6:5 | SG Kaarst | Cedric | Überpass / direkter Annahme-Rückball und Gegenangriff |
| 4 | 12 | 7:5 | SG Kaarst | Cedric | Verpasster gegnerischer Rückball ohne erfundene Spielerwerte |
| 4 | 13 | 7:6 | Gegner | G5 | Block-out nach bestätigter gegnerischer Blockberührung |
| 4 | 14 | 8:6 | SG Kaarst | Slawa | Zuspiel-/Technikfehler |
| 4 | 15 | 8:7 | Gegner | G6 | Dritter Kontakt als Angriff ins Netz |
| 4 | 16 | 9:7 | SG Kaarst | Rayan | Punkt ohne Spielerzuordnung bei verpasstem Ballwechsel |
| 4 | 17 | 10:7 | SG Kaarst | Rayan | Ass |
| 4 | 18 | 10:8 | Gegner | G1 | Aufschlag ins Aus |
| 4 | 19 | 10:9 | Gegner | G1 | Annahme–Zuspiel–Angriff ins Aus |
| 4 | 20 | 10:10 | Gegner | G1 | Notzuspiel im Hinterfeld ins Aus |
| 4 | 21 | 11:10 | SG Kaarst | Lukas | Direkter zweiter Ball |
| 4 | 22 | 12:10 | SG Kaarst | Lukas | Teilgesten: Annahme, Zuspiel und Angriff |
| 4 | 23 | 13:10 | SG Kaarst | Lukas | Langer Ballwechsel mit mehreren abgewehrten Angriffen |
| 4 | 24 | 13:11 | Gegner | G2 | Direkter Blockpunkt |
| 4 | 25 | 13:12 | Gegner | G2 | Block und erster Folgekontakt durch denselben Spieler |
| 4 | 26 | 13:13 | Gegner | G2 | Angriff geblockt, Sicherung auf Angreiferseite und neuer Angriff |
| 4 | 27 | 14:13 | SG Kaarst | Jan | Überpass / direkter Annahme-Rückball und Gegenangriff |
| 4 | 28 | 15:13 | SG Kaarst | Jan | Verpasster gegnerischer Rückball ohne erfundene Spielerwerte |
| 4 | 29 | 15:14 | Gegner | G3 | Block-out nach bestätigter gegnerischer Blockberührung |
| 4 | 30 | 16:14 | SG Kaarst | David | Zuspiel-/Technikfehler |
| 4 | 31 | 17:14 | SG Kaarst | David | Dritter Kontakt als Angriff ins Netz |
| 4 | 32 | 18:14 | SG Kaarst | David | Punkt ohne Spielerzuordnung bei verpasstem Ballwechsel |
| 4 | 33 | 18:15 | Gegner | G4 | Aufschlag ins Netz |
| 4 | 34 | 18:16 | Gegner | G4 | Annahmefehler nach unprotokolliertem Aufschlag |
| 4 | 35 | 19:16 | SG Kaarst | Cedric | Annahme–Zuspiel–Kill |
| 4 | 36 | 20:16 | SG Kaarst | Cedric | Notzuspiel im Hinterfeld ins Aus |
| 4 | 37 | 20:17 | Gegner | G5 | Direkter zweiter Ball |
| 4 | 38 | 21:17 | SG Kaarst | Slawa | Teilgesten: Annahme, Zuspiel und Angriff |
| 4 | 39 | 21:18 | Gegner | G6 | Langer Ballwechsel mit mehreren abgewehrten Angriffen |
| 4 | 40 | 21:19 | Gegner | G6 | Direkter Blockpunkt |
| 4 | 41 | 21:20 | Gegner | G6 | Block und erster Folgekontakt durch denselben Spieler |
| 4 | 42 | 22:20 | SG Kaarst | Rayan | Angriff geblockt, Sicherung auf Angreiferseite und neuer Angriff |
| 4 | 43 | 23:20 | SG Kaarst | Rayan | Überpass / direkter Annahme-Rückball und Gegenangriff |
| 4 | 44 | 23:21 | Gegner | G1 | Verpasster gegnerischer Rückball ohne erfundene Spielerwerte |
| 4 | 45 | 23:22 | Gegner | G1 | Block-out nach bestätigter gegnerischer Blockberührung |
| 4 | 46 | 23:23 | Gegner | G1 | Zuspiel-/Technikfehler |
| 4 | 47 | 24:23 | SG Kaarst | Lukas | Dritter Kontakt als Angriff ins Netz |
| 4 | 48 | 24:24 | Gegner | G2 | Punkt ohne Spielerzuordnung bei verpasstem Ballwechsel |
| 4 | 49 | 25:24 | SG Kaarst | Jan | Aufschlag ins Netz |
| 4 | 50 | 25:25 | Gegner | G3 | Aufschlag ins Aus |
| 4 | 51 | 26:25 | SG Kaarst | David | Annahme–Zuspiel–Kill |
| 4 | 52 | 26:26 | Gegner | G4 | Notzuspiel im Hinterfeld ins Aus |
| 4 | 53 | 27:26 | SG Kaarst | Cedric | Direkter zweiter Ball |
| 4 | 54 | 28:26 | SG Kaarst | Cedric | Teilgesten: Annahme, Zuspiel und Angriff |
