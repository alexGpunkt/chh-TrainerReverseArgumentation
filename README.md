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
