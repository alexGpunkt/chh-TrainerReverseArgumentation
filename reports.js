/* Perspektivwechsel-Trainer 2.0 Phase 5
   Klassenberichte aus lokalen Browserdaten. */
function readProgressForStudent(student) {
  try {
    return JSON.parse(localStorage.getItem(window.storageKeyForUser({ role: "student", classId: student.classId, studentId: student.id })) || "null");
  } catch (e) {
    return null;
  }
}

function summarizeProgress(raw) {
  const stats = raw?.stats || {};
  const solved = raw?.solved ? Object.keys(raw.solved).length : 0;
  const wrong = stats.totalWrong || 0;
  const total = (stats.totalSolved || solved) + wrong;
  const first = stats.firstTry || { correct: 0, total: 0 };
  const last = (stats.history || []).slice(-1)[0];
  return {
    solved,
    wrong,
    accuracy: total ? Math.round(((stats.totalSolved || solved) / total) * 100) : 0,
    firstTryRate: first.total ? Math.round(first.correct / first.total * 100) : 0,
    fallback: stats.fallbackUsed || 0,
    lastTs: last?.ts || null,
    competencies: stats.byCompetency || {}
  };
}

function classReport(classId) {
  return window.studentsByClass(classId).map(student => {
    const raw = readProgressForStudent(student);
    return { student, raw, summary: summarizeProgress(raw) };
  });
}

function classCompetencySummary(classId) {
  const rows = classReport(classId);
  const comp = {};
  rows.forEach(r => {
    Object.entries(r.summary.competencies || {}).forEach(([key, value]) => {
      comp[key] ||= { solved: 0, wrong: 0 };
      comp[key].solved += value.solved || 0;
      comp[key].wrong += value.wrong || 0;
    });
  });
  return comp;
}

function downloadClassCsv(classId) {
  const rows = [["classId", "studentId", "name", "solved", "wrong", "accuracy", "firstTryRate", "fallback", "lastActivity"]];
  classReport(classId).forEach(r => rows.push([
    classId,
    r.student.id,
    r.student.name,
    r.summary.solved,
    r.summary.wrong,
    r.summary.accuracy,
    r.summary.firstTryRate,
    r.summary.fallback,
    r.summary.lastTs ? new Date(r.summary.lastTs).toISOString() : ""
  ]));
  const csv = rows.map(r => r.map(x => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `perspektivwechsel_klassenbericht_${classId}.csv`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}


/* Phase 5b global exports for reliable GitHub Pages loading */
window.readProgressForStudent = readProgressForStudent;
window.summarizeProgress = summarizeProgress;
window.classReport = classReport;
window.classCompetencySummary = classCompetencySummary;
window.downloadClassCsv = downloadClassCsv;
