/* Perspektivwechsel-Trainer 2.0 Phase 5b
   Offline-Schülerverwaltung. Namen bleiben lokal im Browser. */
(function () {
  const DEFAULT_STUDENTS = [
    { id: "demo-alex", name: "Demo Schüler", classId: "demo" },
    { id: "10a-01", name: "Schüler 1", classId: "10a" },
    { id: "10a-02", name: "Schüler 2", classId: "10a" },
    { id: "10b-01", name: "Schüler 3", classId: "10b" }
  ];

  function getStudents() {
    try {
      const stored = JSON.parse(localStorage.getItem("pwTrainerStudents") || "null");
      if (Array.isArray(stored) && stored.length) return stored;
    } catch (e) {}
    return DEFAULT_STUDENTS;
  }

  function saveStudents(students) {
    localStorage.setItem("pwTrainerStudents", JSON.stringify(Array.isArray(students) ? students : DEFAULT_STUDENTS));
  }

  function studentsByClass(classId) {
    return getStudents().filter(s => s.classId === classId);
  }

  function addStudent(name, classId) {
    const clean = String(name || "").trim();
    if (!clean || !classId) return null;
    const students = getStudents();
    const base = clean.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, "-").replace(/^-|-$/g, "") || "schueler";
    const id = `${classId}-${base}-${Date.now().toString(36)}`;
    const entry = { id, name: clean, classId };
    students.push(entry);
    saveStudents(students);
    return entry;
  }

  function parseStudentCsv(text, classId) {
    const lines = String(text || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const created = [];
    lines.forEach(line => {
      const parts = line.split(/[;,]/).map(x => x.trim()).filter(Boolean);
      const name = parts.length >= 2 ? `${parts[1]} ${parts[0]}` : parts[0];
      const s = addStudent(name, classId);
      if (s) created.push(s);
    });
    return created;
  }

  window.DEFAULT_STUDENTS = DEFAULT_STUDENTS;
  window.getStudents = getStudents;
  window.saveStudents = saveStudents;
  window.studentsByClass = studentsByClass;
  window.addStudent = addStudent;
  window.parseStudentCsv = parseStudentCsv;
})();
