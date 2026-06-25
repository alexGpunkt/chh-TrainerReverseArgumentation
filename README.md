# Perspektivwechsel-Trainer – Version 2.0 Phase 2

Diese Version basiert auf der zuletzt lauffähigen Version 2.1 und setzt Phase 2 der Umstellung um.

## Umgesetzt in Phase 2

- `tasks.json` wurde auf das Aufgabenmodell `2.0` angehoben.
- Alle bestehenden 57 Aufgaben bleiben erhalten.
- Jede Aufgabe besitzt nun zusätzlich:
  - `modelVersion`
  - `competency`
  - `difficulty` (`1 = Basis`, `2 = Aufbau`, `3 = Transfer`)
  - `estimatedTime`
  - `tags`
  - `teacherNote`
  - `reflectionPrompt`
- Neue Datei `task-model.js` ergänzt und normalisiert Aufgaben beim Laden.
- Alte 1.x-Aufgaben bleiben grundsätzlich kompatibel, weil fehlende Felder automatisch ergänzt werden.
- Die Oberfläche zeigt nun Kompetenz, Niveau, geschätzte Bearbeitungszeit, Tags und Reflexionsimpuls an.
- Lernanalyse und Export berücksichtigen Kompetenz, Schwierigkeit und Zeitbedarf.
- Cache-Busting wurde auf `v=2.0-phase2` aktualisiert.

## Wichtige Dateien

- `index.html`
- `task-model.js`
- `storage.js`
- `validation.js`
- `analytics.js`
- `export.js`
- `ui-v2.js`
- `app.js`
- `tasks.json`
- `style.css`
- `tracker.js`

## Upload-Hinweis für GitHub Pages

Bitte den kompletten Inhalt dieses Ordners hochladen und vorhandene Dateien überschreiben. Besonders wichtig sind `index.html`, `task-model.js`, `tasks.json`, `ui-v2.js`, `analytics.js`, `export.js`, `validation.js`, `app.js` und `style.css`.

`ui.js` bleibt nur als Altdatei erhalten und wird von `index.html` nicht geladen.


## Phase 2 Layoutfix

Die internen Aufgabenmodell-Metadaten werden im Schülerbildschirm nicht mehr angezeigt. Dadurch rücken Antwortoptionen, Eingabefelder und Feedback in den frei gewordenen Bereich. Die Felder bleiben weiterhin in `tasks.json`, Analyse und Export erhalten.


## Phase 2 Layoutfix 2

Der mobile Aufgabenbildschirm nutzt nun einen Fokusmodus: Die Etappen-Grafik wird auf kleinen Displays ausgeblendet, Abstände und Schriftgrößen werden reduziert und der Aufgabenbereich wird so komprimiert, dass Frage und Antwortmöglichkeiten ohne Scrollen sichtbar bleiben.


## Version 2.0 – Phase 3

Phase 3 ergänzt ein adaptives Lernpfadsystem mit Kompetenzprofil, Wiederholungswarteschlange, Kompetenzkarte und Lernpfad-Empfehlungen. Bestehende Aufgaben bleiben kompatibel; das Aufgabenmodell wird beim Laden normalisiert.


## Version 2.0 – Phase 4

Erweitert die lauffähige Phase-3-Version um Dashboard, Fehleranalyse, Lernhistorie, Zeitdaten, Erstversuchsquote und einen erweiterten JSON-/CSV-Export zur Vorbereitung des späteren Lehrer- und Klassenmodus.
