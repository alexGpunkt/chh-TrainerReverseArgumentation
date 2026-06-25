/* Perspektivwechsel-Trainer 2.0 Phase 5
   Lehrkraftmodus, Schülerauswahl und Dashboard. */
function initUserState() {
  state.user = getActiveUser();
}

function renderRolePanel() {
  const box = document.getElementById("rolePanel");
  if (!box) return;
  const u = getActiveUser();
  box.innerHTML = "";
  const headline = document.createElement("p");
  headline.className = "qualityHint";
  headline.textContent = `Aktiv: ${u.role === "teacher" ? "Lehrkraft" : getDisplayName(u)}`;
  box.appendChild(headline);

  const row = document.createElement("div");
  row.className = "phase5Grid";
  const studentBtn = document.createElement("button");
  studentBtn.className = "secondary";
  studentBtn.textContent = "Schülermodus";
  studentBtn.onclick = () => {
    const firstClass = getClasses()[0]?.id || "demo";
    const firstStudent = studentsByClass(firstClass)[0] || getStudents()[0] || { id: "demo-alex", name: "Demo Schüler", classId: firstClass };
    setActiveUser({ role: "student", classId: firstStudent.classId, studentId: firstStudent.id, displayName: firstStudent.name });
    location.reload();
  };
  const teacherBtn = document.createElement("button");
  teacherBtn.className = "secondary";
  teacherBtn.textContent = "Lehrermodus";
  teacherBtn.onclick = () => {
    setActiveUser({ role: "teacher", classId: getClasses()[0]?.id || "demo", studentId: "teacher", displayName: "Lehrkraft" });
    location.reload();
  };
  row.append(studentBtn, teacherBtn);
  box.appendChild(row);

  const classSelect = document.createElement("select");
  classSelect.id = "phase5ClassSelect";
  getClasses().forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    if (c.id === u.classId) opt.selected = true;
    classSelect.appendChild(opt);
  });
  box.appendChild(classSelect);

  const studentSelect = document.createElement("select");
  studentSelect.id = "phase5StudentSelect";
  box.appendChild(studentSelect);

  function fillStudents() {
    studentSelect.innerHTML = "";
    studentsByClass(classSelect.value).forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name;
      if (s.id === u.studentId) opt.selected = true;
      studentSelect.appendChild(opt);
    });
  }
  fillStudents();
  classSelect.onchange = fillStudents;

  const startBtn = document.createElement("button");
  startBtn.className = "primary";
  startBtn.textContent = "Ausgewählten Schüler starten";
  startBtn.onclick = () => {
    const s = getStudents().find(x => x.id === studentSelect.value);
    if (!s) return alert("Bitte zuerst einen Schüler auswählen.");
    setActiveUser({ role: "student", classId: s.classId, studentId: s.id, displayName: s.name });
    location.reload();
  };
  box.appendChild(startBtn);
}

function renderTeacherDashboard() {
  const box = document.getElementById("teacherDashboard");
  if (!box) return;
  const u = getActiveUser();
  const classId = u.classId || getClasses()[0]?.id || "demo";
  const cls = getClasses().find(c => c.id === classId);
  const rows = classReport(classId);
  box.innerHTML = "";
  appendText(box, "p", `Klasse: ${cls?.name || classId} · ${rows.length} Lernende`, "qualityHint");

  const controls = document.createElement("div");
  controls.className = "phase5Grid";
  const addName = document.createElement("input");
  addName.type = "text";
  addName.placeholder = "Neuer Schülername";
  const addBtn = document.createElement("button");
  addBtn.className = "secondary";
  addBtn.textContent = "Hinzufügen";
  addBtn.onclick = () => {
    if (addStudent(addName.value, classId)) {
      addName.value = "";
      renderRolePanel();
      renderTeacherDashboard();
    }
  };
  controls.append(addName, addBtn);
  box.appendChild(controls);

  const table = document.createElement("div");
  table.className = "teacherRows";
  rows.forEach(r => {
    const line = document.createElement("div");
    line.className = "teacherRow";
    const p = Math.min(100, Math.round((r.summary.solved / Math.max(1, state.data?.stages?.flatMap(s => s.tasks || []).length || 1)) * 100));
    line.innerHTML = `<strong>${escapeHtml(r.student.name)}</strong><span>${r.summary.solved} gelöst · ${r.summary.accuracy}% richtig · Erstversuch ${r.summary.firstTryRate}%</span><div class="p4Track"><div class="p4Fill" style="width:${p}%"></div></div>`;
    table.appendChild(line);
  });
  box.appendChild(table);

  const comp = classCompetencySummary(classId);
  const compBox = document.createElement("div");
  compBox.className = "analysisBox";
  appendText(compBox, "strong", "Kompetenzen der Klasse", "analysisTitle");
  Object.entries(comp).slice(0, 8).forEach(([key, v]) => {
    const total = (v.solved || 0) + (v.wrong || 0);
    const rate = total ? Math.round((v.solved || 0) / total * 100) : 0;
    const row = document.createElement("div");
    row.className = "p4Bar";
    row.innerHTML = `<div class="p4BarTop"><span>${escapeHtml(key)}</span><strong>${rate}%</strong></div><div class="p4Track"><div class="p4Fill" style="width:${rate}%"></div></div><small>${v.solved || 0} richtig · ${v.wrong || 0} Fehler</small>`;
    compBox.appendChild(row);
  });
  if (!Object.keys(comp).length) appendText(compBox, "p", "Noch keine Kompetenzdaten für diese Klasse.");
  box.appendChild(compBox);

  const exportBtn = document.createElement("button");
  exportBtn.className = "primary";
  exportBtn.textContent = "Klassenbericht CSV exportieren";
  exportBtn.onclick = () => downloadClassCsv(classId);
  box.appendChild(exportBtn);
}

function renderPhase5() {
  renderRolePanel();
  renderTeacherDashboard();
}
