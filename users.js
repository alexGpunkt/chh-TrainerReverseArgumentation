/* Perspektivwechsel-Trainer 2.0 Phase 5
   Rollen- und aktive Profilverwaltung. */
const USER_KEY = "pwTrainerActiveUser";

function defaultUser() {
  return { role: "student", classId: "demo", studentId: "demo-alex", displayName: "Demo Schüler" };
}

function getActiveUser() {
  try {
    const u = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    if (u && u.role) return u;
  } catch (e) {}
  const d = defaultUser();
  localStorage.setItem(USER_KEY, JSON.stringify(d));
  return d;
}

function setActiveUser(user) {
  const safe = { ...defaultUser(), ...(user || {}) };
  localStorage.setItem(USER_KEY, JSON.stringify(safe));
  if (window.state) state.user = safe;
  return safe;
}

function storageKeyForUser(user = getActiveUser()) {
  if (user.role === "teacher") return "pwTrainerState_teacher";
  return `pwTrainerState_${user.classId || "demo"}_${user.studentId || "demo-alex"}`;
}

function getDisplayName(user = getActiveUser()) {
  if (user.role === "teacher") return "Lehrkraft";
  return user.displayName || user.studentId || "Schüler";
}


/* Phase 5b global exports for reliable GitHub Pages loading */
window.defaultUser = defaultUser;
window.getActiveUser = getActiveUser;
window.setActiveUser = setActiveUser;
window.storageKeyForUser = storageKeyForUser;
window.getDisplayName = getDisplayName;
