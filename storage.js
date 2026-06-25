/* Perspektivwechsel-Trainer 2.0 Phase 2
   Zentrale Zustandsverwaltung und lokaler Speicher. */
const state = {
  data: null,
  stageIndex: 0,
  taskIndex: 0,
  score: 0,
  solved: {},
  badges: [],
  selectedSort: [],
  attempts: {},
  fallbackMode: false,
  stats: {}
};

const $ = s => document.querySelector(s);
const taskArea = $("#taskArea");

function appendText(parent, tag, text, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = String(text || "");
  parent.appendChild(el);
  return el;
}

function save() {
  localStorage.setItem("pwTrainerState", JSON.stringify({
    stageIndex: state.stageIndex,
    taskIndex: state.taskIndex,
    score: state.score,
    solved: state.solved,
    badges: state.badges,
    attempts: state.attempts,
    stats: state.stats
  }));
}

function loadSaved() {
  try {
    const s = JSON.parse(localStorage.getItem("pwTrainerState") || "{}");
    if (typeof s.stageIndex === "number") state.stageIndex = s.stageIndex;
    if (typeof s.taskIndex === "number") state.taskIndex = s.taskIndex;
    if (typeof s.score === "number") state.score = s.score;
    if (s.solved && typeof s.solved === "object") state.solved = s.solved;
    if (Array.isArray(s.badges)) state.badges = s.badges;
    if (s.attempts && typeof s.attempts === "object") state.attempts = s.attempts;
    if (s.stats && typeof s.stats === "object") state.stats = s.stats;
  } catch (e) {
    console.warn("save corrupt", e);
  }
}

function validateStateIndices() {
  if (!state.data || !state.data.stages || !state.data.stages.length) return false;
  if (state.stageIndex >= state.data.stages.length || state.stageIndex < 0) {
    state.stageIndex = 0;
  }
  const stage = state.data.stages[state.stageIndex];
  if (!stage || !stage.tasks || !stage.tasks.length) return false;
  if (state.taskIndex >= stage.tasks.length || state.taskIndex < 0) {
    state.taskIndex = 0;
  }
  return true;
}

function currentStage() {
  if (!state.data || !state.data.stages || !state.data.stages.length) return null;
  if (state.stageIndex >= state.data.stages.length) state.stageIndex = 0;
  return state.data.stages[state.stageIndex] || null;
}

function currentTask() {
  const stage = currentStage();
  if (!stage || !stage.tasks || !stage.tasks.length) return null;
  if (state.taskIndex >= stage.tasks.length) state.taskIndex = 0;
  return stage.tasks[state.taskIndex] || null;
}

function typeLabel(t) {
  const map = {
    choice: "Auswahl",
    cloze: "Lücke",
    match: "Zuordnung",
    rewrite: "Umformulieren",
    sort: "Reihenfolge",
    promptChoice: "Promptwahl",
    promptRewrite: "Prompt verbessern",
    livePaste: "Live-Check"
  };
  return map[t] || "Aufgabe";
}

function increaseAttempt(t) {
  state.attempts[t.id] = (state.attempts[t.id] || 0) + 1;
  save();
  return state.attempts[t.id];
}