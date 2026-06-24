# Perspektivwechsel-Trainer v1.4

Neu:
- Etappe „Halluzinationen erkennen“
  - erfundene Studien
  - falsche Statistiken
  - Quellen-/Autor:innen-Halluzinationen
- Etappe „Prompt-Chaining“
  - Folge-Prompts nach zu bestätigenden Antworten
  - Alternativhypothesen einfordern
  - mehrstufige Prüfstrategie
- Schärfere Rewrite-Validierung:
  - `mustContainQuestionWord`
  - `mustContainAlternativeExplanations`
  - `mustNotContain`
  - `mustContainClaimTermAny`
  - `minLength`
- Metakognition:
  - Nach gelösten Aufgaben erscheint eine Selbsteinschätzung 1–5
  - Einschätzung wird über `tracker.js` mitgesendet

Weiterhin kostenlos:
- Kein API-Zwang
- Live-Modus bleibt Copy-&-Paste-basiert


v1.5 Bugfixes: try/catch init, sichere Speicherstände, XSS-freie Optionen, QR-Guard, Ladeoverlay, Live-Anleitung.


v1.6: Rollen- und Tonfalltraining, Perspektivmeister-Etappe, Vorbereitung für Lernpfad-Analysen.

v1.7:
- Neue Etappe „Quelle ≠ Beleg“
- Neue Etappe „Rollenwechsel im Dialog“
- Match-Aufgaben XSS-sicherer gerendert
- Reflexionsfeedback nach korrekter Antwort
- stärkere Prompt-Validierung mit Prüfhandlung/Fragestruktur

v1.8:
- lokale Lernpfad-Analyse im Hamburger-Menü
- Auswertung von Fehlversuchen, Hilfen, Aufgabentypen und Selbsteinschätzung
- personalisierte Empfehlung aus lokalen Lernständen
- stärkere Prompt-Strukturprüfung per Frage-/Aufforderungsmuster
- bisherige Sicherheitsfixes bleiben erhalten

v1.9:
- Trend-Analyse pro Aufgabentyp
- Vergleich Sicherheit vs. Korrektheit
- Empfehlungen auf Basis von Confidence-Mustern
- lokale Historie der letzten Aufgabenversuche

v1.10:
- Sparkline-Visualisierung für Trends
- JSON- und CSV-Export lokaler Lernpfaddaten
- Benchmark-Vorbereitung über bestehenden Tracker
- erweiterte Empfehlungen nach Validierungsfehlern
- Abschlussversion vor Version 2.0
