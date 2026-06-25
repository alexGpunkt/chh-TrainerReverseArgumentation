# Perspektivwechsel-Trainer v2.0 Phase 1

Dies ist das erste 2.0-ZIP-Paket auf Grundlage der letzten funktionsfähigen Version 1.10.

## Ziel von Phase 1

Phase 1 setzt die technische Modularisierung um, ohne die bestehende Funktionalität oder den Aufgabenpool zu verändern. Die Anwendung bleibt weiterhin statisch, offlinefähig und für GitHub Pages geeignet.

## Neue Dateistruktur

- `index.html` – Grundgerüst und Script-Reihenfolge
- `style.css` – bestehendes Layout
- `tasks.json` – bestehender Aufgabenpool
- `storage.js` – Zustand, localStorage, Etappen-/Aufgaben-Helfer
- `validation.js` – Normalisierung und Rewrite-/Prompt-Validierung
- `analytics.js` – Statistik, Lernanalyse, Trends, Reflexion
- `export.js` – lokaler JSON-/CSV-Export
- `ui-v2.js` – Rendering, Aufgabenoberfläche, Navigation, QR-Code
- `tracker.js` – optionaler externer Fortschrittstracker
- `app.js` – schlanker Bootstrap: Laden, Events binden, Start

## Erhaltene Funktionen aus v1.10

- Framing-Erkennung
- Halluzinationen erkennen
- Quelle ≠ Beleg
- Prompt-Chaining
- Rollenwechsel und Tonfalltraining
- Live-Paste-Modus
- Rewrite-Validierung
- Hilfestufe nach Fehlversuchen
- Fortschrittsspeicherung im Browser
- Abzeichen und Etappenfortschritt
- Lernpfad-Analyse
- Trend-Sparklines
- Confidence-/Selbsteinschätzung
- CSV- und JSON-Export
- optionaler Tracker

## Technische Hinweise

Die Dateien werden bewusst als klassische Browser-Skripte geladen und nicht als ES-Module. Dadurch funktioniert die Anwendung weiterhin direkt als einfache statische Website, ohne Build-Prozess, ohne Serverlogik und ohne npm-Abhängigkeiten.

Die Script-Reihenfolge in `index.html` ist wichtig:

1. `storage.js`
2. `validation.js`
3. `analytics.js`
4. `export.js`
5. `ui-v2.js`
6. `tracker.js`
7. `app.js`

## Regressionstest Phase 1

Durchgeführt:

- Syntaxprüfung aller JavaScript-Dateien mit `node --check`
- Aufgabenpool unverändert belassen
- HTML-Script-Reihenfolge angepasst
- Export-, Analyse-, Validierungs- und UI-Funktionen aus der monolithischen Datei herausgelöst

## Nächster Schritt

Phase 2 kann nun auf dieser modularen Basis beginnen. Vorgesehen ist die Überarbeitung des Aufgabenmodells, ohne die bestehenden Aufgaben unbrauchbar zu machen.


## Phase 1b Cache-Fix

Die UI-Datei heißt nun `ui-v2.js` und alle Skripte werden in `index.html` mit Versionsparameter geladen. Dadurch werden alte GitHub-Pages/Browser-Caches umgangen.


## Phase 1c AppendText-Fix

Ergänzt die fehlende globale Hilfsfunktion `appendText(...)`, die von `ui-v2.js` und `analytics.js` verwendet wird. Außerdem wurden die Cache-Parameter auf `v=2.0-phase1c` erhöht.
