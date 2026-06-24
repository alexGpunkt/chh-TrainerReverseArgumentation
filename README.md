# Perspektivwechsel-Trainer

Mobile HTML/CSS/JS-App zum Trainieren von Perspektivwechseln in der eigenen Argumentation.

Start:
1. Ordner entpacken.
2. index.html öffnen.
3. Bei strengem Browser-CORS ggf. über einen kleinen lokalen Server starten.

Aufgabenpool:
- Datei `tasks.json` erweitern.
- Unterstützte Typen: `choice`, `cloze`, `match`, `rewrite`, `sort`.

Tracker:
- In `tracker.js` die Konstante `DASHBOARD_ENDPOINT` auf die übliche Dashboard-Adresse setzen.

QR-Ziel:
- In `tasks.json` unter `meta.qrTarget` anpassen.

Hinweis:
Der QR-Code ist als stabiler Platzhalter visualisiert. Für einen echten scanbaren QR-Code kann später eine QR-Library ergänzt werden.
