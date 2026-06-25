/* Perspektivwechsel-Trainer 2.0 Phase 5
   Offline-Klassenbasis. Kann später durch Import, Datei oder Cloud ersetzt werden. */
const DEFAULT_CLASSES = [
  { id: "demo", name: "Demo-Klasse" },
  { id: "10a", name: "10a" },
  { id: "10b", name: "10b" }
];

function getClasses() {
  try {
    const stored = JSON.parse(localStorage.getItem("pwTrainerClasses") || "null");
    if (Array.isArray(stored) && stored.length) return stored;
  } catch (e) {}
  return DEFAULT_CLASSES;
}

function saveClasses(classes) {
  localStorage.setItem("pwTrainerClasses", JSON.stringify(Array.isArray(classes) ? classes : DEFAULT_CLASSES));
}

function addClass(name) {
  const clean = String(name || "").trim();
  if (!clean) return null;
  const classes = getClasses();
  const id = clean.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, "-").replace(/^-|-$/g, "") || `klasse-${Date.now()}`;
  const uniqueId = classes.some(c => c.id === id) ? `${id}-${Date.now().toString(36)}` : id;
  const entry = { id: uniqueId, name: clean };
  classes.push(entry);
  saveClasses(classes);
  return entry;
}
