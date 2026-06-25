/* Perspektivwechsel-Trainer 2.0 Phase 4
   Adaptives Lernpfadsystem: Kompetenzprofil, Wiederholungen und Empfehlungen. */
const LEARNING_PATH_VERSION = "3.0";

function ensureLearningPath() {
  if (!state.learningPath || typeof state.learningPath !== "object") state.learningPath = {};
  state.learningPath.version ||= LEARNING_PATH_VERSION;
  state.learningPath.competencies ||= {};
  state.learningPath.reviewQueue ||= [];
  state.learningPath.taskAttempts ||= {};
  state.learningPath.firstTry ||= {};
  state.learningPath.recommendations ||= [];
}

function getTaskCompetencies(task) {
  const list = [];
  if (Array.isArray(task?.competencies)) list.push(...task.competencies);
  if (task?.competency) list.push(task.competency);
  if (!list.length) list.push("Perspektivwechsel");
  return [...new Set(list.map(x => String(x || "").trim()).filter(Boolean))];
}

function ensureCompetencyProfile(name) {
  ensureLearningPath();
  const key = String(name || "Perspektivwechsel");
  state.learningPath.competencies[key] ||= {
    correct: 0,
    wrong: 0,
    firstTryCorrect: 0,
    fallbackUsed: 0,
    reviewCount: 0,
    lastTs: 0,
    mastery: 0
  };
  return state.learningPath.competencies[key];
}

function updateMastery(profile) {
  const total = Math.max(1, profile.correct + profile.wrong);
  const accuracy = profile.correct / total;
  const firstTryBonus = Math.min(0.12, (profile.firstTryCorrect || 0) / total * 0.12);
  const fallbackPenalty = Math.min(0.20, (profile.fallbackUsed || 0) / total * 0.20);
  const reviewPenalty = Math.min(0.12, (profile.reviewCount || 0) / Math.max(3, total) * 0.08);
  profile.mastery = Math.max(0, Math.min(1, accuracy + firstTryBonus - fallbackPenalty - reviewPenalty));
}

function recordLearningPathAttempt(ok, task, usedFallback = false) {
  ensureLearningPath();
  if (!task) return;
  const taskId = task.id;
  const attemptsBefore = state.learningPath.taskAttempts[taskId] || 0;
  state.learningPath.taskAttempts[taskId] = attemptsBefore + 1;
  const firstTry = attemptsBefore === 0 && !usedFallback;

  getTaskCompetencies(task).forEach(name => {
    const p = ensureCompetencyProfile(name);
    if (ok) p.correct += 1;
    else p.wrong += 1;
    if (ok && firstTry) p.firstTryCorrect += 1;
    if (usedFallback) p.fallbackUsed += 1;
    p.lastTs = Date.now();
    updateMastery(p);
  });

  if (!ok) scheduleReview(task, usedFallback ? 2 : 4);
  buildLearningPathRecommendations();
  save();
}

function taskLocationById(taskId) {
  const stages = state.data?.stages || [];
  for (let si = 0; si < stages.length; si++) {
    const ti = (stages[si].tasks || []).findIndex(t => t.id === taskId);
    if (ti >= 0) return { stageIndex: si, taskIndex: ti };
  }
  return null;
}

function scheduleReview(task, delay = 4) {
  ensureLearningPath();
  if (!task?.id) return;
  const existing = state.learningPath.reviewQueue.find(x => x.taskId === task.id);
  const item = {
    taskId: task.id,
    stageId: currentStage()?.id || "",
    dueAfter: Math.max(1, delay),
    addedAt: Date.now(),
    reason: `Wiederholung: ${getTaskCompetencies(task)[0]}`
  };
  if (existing) Object.assign(existing, item, { dueAfter: Math.min(existing.dueAfter || delay, delay) });
  else state.learningPath.reviewQueue.push(item);
}

function tickReviewQueue() {
  ensureLearningPath();
  state.learningPath.reviewQueue.forEach(item => item.dueAfter = Math.max(0, (item.dueAfter || 0) - 1));
}

function takeDueReviewTask() {
  ensureLearningPath();
  const idx = state.learningPath.reviewQueue.findIndex(item => (item.dueAfter || 0) <= 0);
  if (idx < 0) return null;
  const [item] = state.learningPath.reviewQueue.splice(idx, 1);
  const loc = taskLocationById(item.taskId);
  if (loc) {
    getTaskCompetencies(state.data.stages[loc.stageIndex].tasks[loc.taskIndex]).forEach(name => {
      const p = ensureCompetencyProfile(name);
      p.reviewCount += 1;
      updateMastery(p);
    });
  }
  return loc;
}

function weakestCompetency() {
  ensureLearningPath();
  const entries = Object.entries(state.learningPath.competencies || {})
    .filter(([,p]) => (p.correct + p.wrong) >= 1)
    .sort((a,b) => (a[1].mastery || 0) - (b[1].mastery || 0));
  return entries[0] || null;
}

function masteryBlocks(value) {
  const n = Math.max(0, Math.min(5, Math.round((Number(value) || 0) * 5)));
  return "■".repeat(n) + "□".repeat(5 - n);
}

function buildLearningPathRecommendations() {
  ensureLearningPath();
  const recs = [];
  const weak = weakestCompetency();
  if (weak) {
    const [name, p] = weak;
    if ((p.mastery || 0) < 0.55) recs.push(`Wiederhole zuerst: ${name}.`);
    else if ((p.mastery || 0) < 0.75) recs.push(`Festige als Nächstes: ${name}.`);
  }
  const due = (state.learningPath.reviewQueue || []).filter(x => (x.dueAfter || 0) <= 0).length;
  if (due) recs.push(`${due} Wiederholungsaufgabe(n) sind bereit.`);
  if (!recs.length) recs.push("Der Lernpfad ist stabil: Arbeite mit der nächsten Aufgabe weiter.");
  state.learningPath.recommendations = recs.slice(0, 3);
}

function renderCompetencyMap() {
  ensureLearningPath();
  const box = document.getElementById("competencyMap");
  if (!box) return;
  const entries = Object.entries(state.learningPath.competencies || {})
    .sort((a,b) => (b[1].correct + b[1].wrong) - (a[1].correct + a[1].wrong));
  if (!entries.length) {
    box.textContent = "Noch keine Kompetenzdaten.";
    return;
  }
  box.innerHTML = entries.map(([name,p]) => `
    <div class="competencyRow">
      <span class="competencyName">${escapeHtml(name)}</span>
      <span class="competencyBlocks" aria-label="${Math.round((p.mastery || 0)*100)} Prozent">${masteryBlocks(p.mastery)}</span>
    </div>
  `).join("");
}

function renderLearningPathRecommendation() {
  ensureLearningPath();
  buildLearningPathRecommendations();
  const box = document.getElementById("learningPathRecommendation");
  if (!box) return;
  box.innerHTML = (state.learningPath.recommendations || []).map(r => `<p>${escapeHtml(r)}</p>`).join("");
}

function nextAdaptivePosition() {
  tickReviewQueue();
  const review = takeDueReviewTask();
  if (review) return review;
  const st = currentStage();
  if (!st) return null;
  if (state.taskIndex < st.tasks.length - 1) return { stageIndex: state.stageIndex, taskIndex: state.taskIndex + 1 };
  if (state.stageIndex < state.data.stages.length - 1) return { stageIndex: state.stageIndex + 1, taskIndex: 0 };
  return null;
}
