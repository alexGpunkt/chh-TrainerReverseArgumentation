/* Perspektivwechsel-Trainer 2.0 Phase 2
   Aufgabenmodell, Normalisierung und Rückwärtskompatibilität.
   Bestehende 1.x-Aufgaben bleiben lauffähig und werden beim Laden ergänzt. */

const TASK_MODEL_VERSION = "2.0";

const DEFAULT_ESTIMATED_TIME = {
  choice: 2,
  promptChoice: 3,
  cloze: 2,
  match: 4,
  rewrite: 5,
  promptRewrite: 5,
  sort: 4,
  livePaste: 7
};

const DEFAULT_REFLECTION_PROMPTS = {
  choice: "Warum ist genau diese Auswahl besser als die anderen Möglichkeiten?",
  promptChoice: "Woran erkennst du, dass dieser Prompt weniger suggestiv ist?",
  cloze: "Welches Schlüsselwort hat dir bei der Lösung geholfen?",
  match: "Welche Zuordnung war am schwierigsten und warum?",
  rewrite: "Welche Formulierung macht deinen Prompt prüfender und weniger bestätigend?",
  promptRewrite: "Welche Formulierung verhindert, dass das LLM nur deine Annahme bestätigt?",
  sort: "Warum ist diese Reihenfolge für eine kritische Prüfung sinnvoll?",
  livePaste: "Welche Schwäche oder Stärke der LLM-Antwort hast du erkannt?"
};

function cleanTag(value) {
  return String(value || "")
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueTags(items) {
  const result = [];
  (items || []).forEach(item => {
    const tag = cleanTag(item);
    if (tag && !result.includes(tag)) result.push(tag);
  });
  return result.slice(0, 8);
}

function inferDifficulty(task, stageIndex = 0) {
  const type = task?.type || "choice";
  let level = 1;
  if (["match", "sort", "promptChoice"].includes(type)) level = 2;
  if (["rewrite", "promptRewrite", "livePaste"].includes(type)) level = 3;
  if (stageIndex >= 7 && level < 3) level++;
  return Math.max(1, Math.min(3, level));
}

function normalizeTask(task, stage, stageIndex, taskIndex) {
  const t = task && typeof task === "object" ? task : {};
  const type = t.type || "choice";
  const competency = t.competency || stage.competency || stage.goal || "Perspektivwechsel anwenden";
  const baseTags = [type, stage.id, stage.title, competency]
    .concat(Array.isArray(t.tags) ? t.tags : []);

  return {
    ...t,
    id: t.id || `${stage.id || "stage"}-${taskIndex + 1}`,
    type,
    modelVersion: t.modelVersion || TASK_MODEL_VERSION,
    competency,
    difficulty: Number.isFinite(Number(t.difficulty)) ? Math.max(1, Math.min(3, Number(t.difficulty))) : inferDifficulty(t, stageIndex),
    estimatedTime: Number.isFinite(Number(t.estimatedTime)) ? Math.max(1, Number(t.estimatedTime)) : (DEFAULT_ESTIMATED_TIME[type] || 3),
    tags: uniqueTags(baseTags),
    teacherNote: t.teacherNote || `Beobachte, ob Lernende ihre Entscheidung begründen können. Schwerpunkt: ${competency}`,
    reflectionPrompt: t.reflectionPrompt || DEFAULT_REFLECTION_PROMPTS[type] || "Welche Denkstrategie hast du bei dieser Aufgabe genutzt?"
  };
}

function normalizeStage(stage, stageIndex) {
  const s = stage && typeof stage === "object" ? stage : {};
  const id = s.id || `etappe-${stageIndex}`;
  const title = s.title || `Etappe ${stageIndex + 1}`;
  const competency = s.competency || s.goal || title;
  const tasks = Array.isArray(s.tasks) ? s.tasks : [];
  return {
    ...s,
    id,
    title,
    competency,
    tasks: tasks.map((task, taskIndex) => normalizeTask(task, { ...s, id, title, competency }, stageIndex, taskIndex))
  };
}

function normalizeCourseData(data) {
  const safe = data && typeof data === "object" ? data : {};
  const meta = {
    ...(safe.meta || {}),
    version: safe.meta?.version || "2.0-phase2",
    taskModelVersion: TASK_MODEL_VERSION
  };
  const stages = Array.isArray(safe.stages) ? safe.stages.map(normalizeStage) : [];
  return { ...safe, meta, stages };
}

function difficultyLabel(level) {
  const n = Number(level) || 1;
  if (n <= 1) return "Basis";
  if (n === 2) return "Aufbau";
  return "Transfer";
}
