/* Perspektivwechsel-Trainer 2.0 Phase 6
   Regelbasierter intelligenter Tutor: offline, ohne KI-API. */
function p6Escape(value) {
  if (typeof escapeHtml === "function") return escapeHtml(value);
  return String(value ?? "").replace(/[&<>\"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));
}

function p6Percent(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

function p6Bar(label, value, detail = "") {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return `<div class="p4Bar"><div class="p4BarTop"><span>${p6Escape(label)}</span><strong>${v}%</strong></div><div class="p4Track"><div class="p4Fill" style="width:${v}%"></div></div>${detail ? `<small>${p6Escape(detail)}</small>` : ""}</div>`;
}

function getStudentAnalysis(raw) {
  const summary = typeof summarizeProgress === "function" ? summarizeProgress(raw) : { solved: 0, wrong: 0, accuracy: 0, firstTryRate: 0, competencies: {} };
  const history = raw?.stats?.history || [];
  const totalAttempts = history.length || summary.solved + summary.wrong;
  const avgTime = history.length ? Math.round(history.reduce((sum, h) => sum + (h.durationSec || 0), 0) / history.length) : 0;
  const comps = Object.entries(summary.competencies || {}).map(([key, v]) => {
    const solved = v.solved || 0;
    const wrong = v.wrong || 0;
    const total = solved + wrong;
    return { key, solved, wrong, total, mastery: p6Percent(solved, total) };
  }).filter(x => x.total).sort((a, b) => a.mastery - b.mastery || b.total - a.total);
  const weakest = comps[0] || null;
  const strongest = [...comps].sort((a, b) => b.mastery - a.mastery || b.total - a.total)[0] || null;
  const lastFive = history.slice(-5);
  const recentAccuracy = lastFive.length ? p6Percent(lastFive.filter(h => h.correct).length, lastFive.length) : summary.accuracy;
  const type = detectLearnerPattern({ summary, avgTime, history, recentAccuracy });
  return { summary, history, totalAttempts, avgTime, comps, weakest, strongest, recentAccuracy, type };
}

function detectLearnerPattern({ summary, avgTime, history, recentAccuracy }) {
  if (!history.length) return { id: "new", title: "Startphase", text: "Es liegen noch zu wenige Daten für eine sichere Diagnose vor." };
  if (avgTime <= 12 && summary.accuracy < 70) return { id: "fast-errors", title: "Schnell, aber noch ungenau", text: "Du arbeitest sehr zügig. Prüfe vor dem Anklicken noch einmal die genaue Formulierung der Antwort." };
  if (avgTime >= 45 && summary.accuracy >= 75) return { id: "slow-safe", title: "Gründlich und sicher", text: "Du arbeitest sorgfältig und beantwortest viele Aufgaben richtig. Ziel ist nun, etwas sicherer und schneller zu werden." };
  const secondChance = history.filter(h => h.usedFallback || h.firstTry === false).length;
  if (secondChance >= 3 && recentAccuracy >= 70) return { id: "reflective", title: "Gute Reflexionsfähigkeit", text: "Du nutzt Rückmeldungen produktiv und verbesserst dich nach Fehlversuchen sichtbar." };
  if (summary.accuracy >= 85) return { id: "secure", title: "Sicheres Arbeiten", text: "Du löst die Aufgaben sehr zuverlässig. Transfer- und Begründungsaufgaben sind jetzt sinnvoll." };
  return { id: "balanced", title: "Stabiler Lernstand", text: "Dein Lernstand entwickelt sich stabil. Arbeite gezielt an den Kompetenzen mit den meisten Fehlern." };
}

function generateStudentFeedback(raw = state) {
  const a = getStudentAnalysis(raw);
  const name = raw?.user?.displayName || state?.user?.displayName || "Du";
  if (!a.totalAttempts) {
    return `${name}: Bearbeite zunächst einige Aufgaben. Danach erstellt der Tutor eine persönliche Lernanalyse.`;
  }
  const parts = [];
  if (a.strongest) parts.push(`Stärke: ${a.strongest.key} gelingt aktuell am sichersten (${a.strongest.mastery}%).`);
  if (a.weakest) parts.push(`Förderbereich: ${a.weakest.key} sollte als Nächstes wiederholt werden (${a.weakest.mastery}%).`);
  parts.push(a.type.text);
  if (a.recentAccuracy >= 80) parts.push("Die letzten Aufgaben zeigen einen positiven Verlauf.");
  if (a.recentAccuracy < 55 && a.history.length >= 5) parts.push("Bei den letzten Aufgaben gab es mehrere Unsicherheiten. Eine kurze Wiederholung vor neuen Etappen ist sinnvoll.");
  return parts.join(" ");
}

function generateNextTrainingPlan(raw = state) {
  const a = getStudentAnalysis(raw);
  if (!a.totalAttempts) return ["Starte mit drei Basisaufgaben aus der ersten Etappe."];
  const plan = [];
  if (a.weakest) plan.push(`3 Wiederholungsaufgaben zu „${a.weakest.key}“ bearbeiten.`);
  if (a.summary.firstTryRate < 70) plan.push("Bei jeder Aufgabe zuerst die Schlüsselwörter markieren oder innerlich benennen.");
  if (a.avgTime > 45) plan.push("Danach 2 kurze Basisaufgaben mit Zeitfokus lösen.");
  else plan.push("Danach 2 Transferaufgaben mit ausführlicher Begründung lösen.");
  if (a.strongest && a.strongest.key !== a.weakest?.key) plan.push(`Zum Abschluss eine Aufgabe aus der Stärke „${a.strongest.key}“ als Erfolgssicherung.`);
  return plan;
}

function generateTeacherFeedback(student, raw) {
  const a = getStudentAnalysis(raw);
  if (!a.totalAttempts) return `${student.name}: noch keine auswertbaren Lernaktivitäten.`;
  const focus = a.weakest ? `Förderbedarf besteht vor allem bei ${a.weakest.key}.` : "Noch kein klarer Förderschwerpunkt erkennbar.";
  return `${student.name}: ${a.type.title}. Genauigkeit ${a.summary.accuracy}%, Erstversuch ${a.summary.firstTryRate}%, Ø ${a.avgTime}s. ${focus}`;
}

function generateClassFeedback(classId) {
  const rows = typeof classReport === "function" ? classReport(classId) : [];
  if (!rows.length) return "Noch keine Klasse ausgewählt.";
  const active = rows.filter(r => (r.summary.solved + r.summary.wrong) > 0);
  if (!active.length) return "Für diese Klasse liegen noch keine auswertbaren Lernaktivitäten vor.";
  const avgAccuracy = Math.round(active.reduce((s, r) => s + (r.summary.accuracy || 0), 0) / active.length);
  const comp = typeof classCompetencySummary === "function" ? classCompetencySummary(classId) : {};
  const compRows = Object.entries(comp).map(([key, v]) => {
    const total = (v.solved || 0) + (v.wrong || 0);
    return { key, total, mastery: p6Percent(v.solved || 0, total), wrong: v.wrong || 0 };
  }).filter(x => x.total).sort((a, b) => a.mastery - b.mastery || b.wrong - a.wrong);
  const weakest = compRows[0];
  const strongest = [...compRows].sort((a, b) => b.mastery - a.mastery)[0];
  let text = `Die Klasse erreicht aktuell durchschnittlich ${avgAccuracy}% Genauigkeit bei ${active.length} aktiven Lernenden.`;
  if (weakest) text += ` Gemeinsamer Wiederholungsbedarf: ${weakest.key} (${weakest.mastery}%).`;
  if (strongest) text += ` Stärkste Kompetenz: ${strongest.key} (${strongest.mastery}%).`;
  return text;
}

function classTutorReport(classId) {
  const rows = typeof classReport === "function" ? classReport(classId) : [];
  return {
    schema: "phase6-offline-tutor-report",
    classId,
    generatedAt: new Date().toISOString(),
    classFeedback: generateClassFeedback(classId),
    students: rows.map(r => ({
      id: r.student.id,
      name: r.student.name,
      summary: r.summary,
      feedback: generateTeacherFeedback(r.student, r.raw),
      nextTraining: generateNextTrainingPlan(r.raw || {})
    }))
  };
}

function renderTutorFeedback() {
  const box = document.getElementById("tutorFeedback");
  if (!box) return;
  const feedback = generateStudentFeedback(state);
  const plan = generateNextTrainingPlan(state);
  box.innerHTML = `<p>${p6Escape(feedback)}</p><strong>Nächste Trainingseinheit</strong><ol>${plan.map(x => `<li>${p6Escape(x)}</li>`).join("")}</ol>`;
}

function renderTeacherInsights() {
  const box = document.getElementById("teacherInsights");
  if (!box) return;
  const u = typeof getActiveUser === "function" ? getActiveUser() : state.user;
  const classId = u?.classId || (typeof getClasses === "function" ? getClasses()[0]?.id : "demo") || "demo";
  const rows = typeof classReport === "function" ? classReport(classId) : [];
  box.innerHTML = `<p>${p6Escape(generateClassFeedback(classId))}</p>`;
  const list = document.createElement("div");
  list.className = "teacherRows";
  rows.slice(0, 8).forEach(r => {
    const item = document.createElement("div");
    item.className = "teacherRow";
    item.innerHTML = `<strong>${p6Escape(r.student.name)}</strong><span>${p6Escape(generateTeacherFeedback(r.student, r.raw))}</span>`;
    list.appendChild(item);
  });
  if (rows.length) box.appendChild(list);
  const btn = document.createElement("button");
  btn.className = "secondary";
  btn.textContent = "Tutorbericht JSON exportieren";
  btn.onclick = () => downloadTutorReport(classId);
  box.appendChild(btn);
}

function downloadTutorReport(classId) {
  const payload = classTutorReport(classId);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }));
  a.download = `perspektivwechsel_tutorbericht_${classId}.json`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}

function renderPhase6() {
  renderTutorFeedback();
  renderTeacherInsights();
}

window.getStudentAnalysis = getStudentAnalysis;
window.generateStudentFeedback = generateStudentFeedback;
window.generateTeacherFeedback = generateTeacherFeedback;
window.generateClassFeedback = generateClassFeedback;
window.generateNextTrainingPlan = generateNextTrainingPlan;
window.classTutorReport = classTutorReport;
window.downloadTutorReport = downloadTutorReport;
window.renderPhase6 = renderPhase6;
