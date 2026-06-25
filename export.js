/* Perspektivwechsel-Trainer 2.0 Phase 2
   Lokaler Export der Lernfortschrittsdaten. */
function exportData(format) {
  ensureStats();
  const payload = {
    app: "perspektivwechsel-trainer",
    version: state.data?.meta?.version || "",
    exportedAt: new Date().toISOString(),
    stats: state.stats,
    solved: state.solved,
    badges: state.badges,
    taskModelVersion: state.data?.meta?.taskModelVersion || "",
    course: {
      stageCount: state.data?.stages?.length || 0,
      taskCount: state.data?.stages?.flatMap(s => s.tasks || []).length || 0
    }
  };
  let blob, name;
  if (format === "csv") {
    const rows = [["timestamp", "stageId", "taskId", "taskType", "competency", "difficulty", "estimatedTime", "correct", "usedFallback", "confidence"]];
    (state.stats.history || []).forEach(h => rows.push([
      new Date(h.ts).toISOString(),
      h.stageId, h.taskId, h.taskType,
      h.competency || "", h.difficulty || "", h.estimatedTime || "",
      h.correct, h.usedFallback, h.confidence ?? ""
    ]));
    const csv = rows.map(r => r.map(x => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n");
    blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    name = "perspektivwechsel_lernpfad.csv";
  } else {
    blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    name = "perspektivwechsel_lernpfad.json";
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}
