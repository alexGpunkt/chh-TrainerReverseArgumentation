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
  _loaded: false
};

const $ = s => document.querySelector(s);
const taskArea = $("#taskArea");
const loadingOverlay = $("#loadingOverlay");
const loaderBar = $("#loaderBar");

// ===== SPEICHERN & LADEN =====
function save() {
  try {
    localStorage.setItem("pwTrainerState", JSON.stringify({
      stageIndex: state.stageIndex,
      taskIndex: state.taskIndex,
      score: state.score,
      solved: state.solved,
      badges: state.badges,
      attempts: state.attempts
    }));
  } catch (e) { console.warn("Save failed:", e); }
}

function loadSaved() {
  try {
    const raw = localStorage.getItem("pwTrainerState");
    if (!raw) return;
    const saved = JSON.parse(raw);
    // Nur gültige Felder übernehmen
    if (typeof saved.stageIndex === 'number') state.stageIndex = saved.stageIndex;
    if (typeof saved.taskIndex === 'number') state.taskIndex = saved.taskIndex;
    if (typeof saved.score === 'number') state.score = saved.score;
    if (saved.solved && typeof saved.solved === 'object') state.solved = saved.solved;
    if (Array.isArray(saved.badges)) state.badges = saved.badges;
    if (saved.attempts && typeof saved.attempts === 'object') state.attempts = saved.attempts;
  } catch (e) { console.warn("Load saved failed:", e); }
}

// ===== HELFER =====
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/\s+/g, " ");
}

function currentStage() {
  if (!state.data || !state.data.stages || state.data.stages.length === 0) return null;
  if (state.stageIndex >= state.data.stages.length) state.stageIndex = 0;
  return state.data.stages[state.stageIndex];
}

function currentTask() {
  const st = currentStage();
  if (!st || !st.tasks || st.tasks.length === 0) return null;
  if (state.taskIndex >= st.tasks.length) state.taskIndex = 0;
  return st.tasks[state.taskIndex];
}

function typeLabel(t) {
  const map = {
    choice: "Auswahl",
    cloze: "Lücke",
    match: "Zuordnung",
    rewrite: "Umformulieren",
    sort: "Reihenfolge"
  };
  return map[t] || "Aufgabe";
}

// ===== QR-CODE (vereinfacht, aber funktional) =====
function renderQr(text) {
  const c = $("#qrCanvas");
  const ctx = c.getContext("2d");
  const size = c.width;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, size, size);
  
  // Einfaches QR-ähnliches Muster (für Demo-Zwecke)
  // In einer echten App würde man eine QR-Bibliothek einbinden
  ctx.fillStyle = "#111827";
  const cellSize = size / 17;
  let seed = 0;
  for (let ch of text) seed = (seed + ch.charCodeAt(0) * 17) % 9973;
  
  for (let y = 0; y < 17; y++) {
    for (let x = 0; x < 17; x++) {
      // Positionierungsmuster
      const isPosPattern = (x < 4 && y < 4) || (x > 12 && y < 4) || (x < 4 && y > 12);
      const isTiming = (y === 6 || x === 6) && x >= 4 && x <= 12 && y >= 4 && y <= 12;
      const on = isPosPattern || isTiming || ((x * y + seed + x + y * 3) % 5 === 0);
      if (on) {
        ctx.fillRect(
          2 + x * cellSize,
          2 + y * cellSize,
          cellSize - 1,
          cellSize - 1
        );
      }
    }
  }
}

// ===== RENDER-FUNKTIONEN =====
function render() {
  const st = currentStage();
  const t = currentTask();
  
  if (!st || !t) {
    $("#stageTitle").textContent = "Keine Aufgaben gefunden";
    taskArea.innerHTML = "<p>Bitte lade die Seite neu oder kontaktiere den Support.</p>";
    return;
  }

  state.fallbackMode = false;
  $("#stageTitle").textContent = st.title || "Etappe";
  $("#prompt").textContent = t.prompt || "Aufgabe";
  $("#claim").textContent = t.claim || "";
  $("#claim").style.display = t.claim ? "block" : "none";
  $("#taskType").textContent = typeLabel(t.type);
  $("#taskCount").textContent = `${state.taskIndex + 1}/${st.tasks.length}`;
  $("#scorePill").textContent = `${state.score} ✓`;
  $("#feedback").textContent = "";
  $("#feedback").className = "feedback";
  $("#nextBtn").disabled = true;
  $("#checkBtn").disabled = false;
  $("#taskHint").textContent = st.hint || "Kein Hinweis verfügbar.";
  state.selectedSort = [];
  
  renderProgress();
  renderTask(t);
  save();
}

function renderTask(t) {
  taskArea.innerHTML = "";
  
  if (!t) return;

  switch (t.type) {
    case "choice":
      renderChoice(t.options || [], "choice");
      break;
      
    case "cloze":
      const p = document.createElement("p");
      p.innerHTML = (t.text || "").replace("___", "<strong>_____</strong>");
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Antwort eingeben";
      input.id = "clozeInput";
      input.autocomplete = "off";
      input.addEventListener("keydown", e => { if (e.key === "Enter") check(); });
      taskArea.append(p, input);
      setTimeout(() => input.focus(), 100);
      break;
      
    case "match":
      const pairs = t.pairs || [];
      const shuffledRight = [...pairs.map(p => p[1])].sort(() => Math.random() - 0.5);
      pairs.forEach((pair, idx) => {
        const row = document.createElement("div");
        row.className = "matchRow";
        row.innerHTML = `<strong>${pair[0]}</strong>`;
        const sel = document.createElement("select");
        sel.dataset.answer = pair[1];
        sel.dataset.index = idx;
        sel.innerHTML = `<option value="">Wähle…</option>` + 
          shuffledRight.map(x => `<option value="${x}">${x}</option>`).join("");
        row.appendChild(sel);
        taskArea.appendChild(row);
      });
      break;
      
    case "rewrite":
      const info = document.createElement("p");
      info.textContent = "Tipp: Formuliere vorsichtig, aber nicht beliebig. Der Sinn soll erhalten bleiben.";
      info.style.fontSize = ".85rem";
      info.style.color = "var(--muted)";
      const ta = document.createElement("textarea");
      ta.id = "rewriteInput";
      ta.placeholder = "Deine umformulierte Version…";
      taskArea.append(info, ta);
      setTimeout(() => ta.focus(), 100);
      break;
      
    case "sort":
      const box = document.createElement("div");
      box.style.display = "flex";
      box.style.flexDirection = "column";
      box.style.gap = "6px";
      const items = [...(t.items || [])];
      const shuffledItems = items.sort(() => Math.random() - 0.5);
      shuffledItems.forEach(item => {
        const div = document.createElement("button");
        div.type = "button";
        div.className = "sortItem";
        div.textContent = item;
        div.dataset.value = item;
        div.onclick = () => {
          if (state.selectedSort.includes(item)) return;
          state.selectedSort.push(item);
          div.classList.add("active");
          div.textContent = `${state.selectedSort.length}. ${item}`;
          // Prüfe ob alle sortiert sind
          if (state.selectedSort.length === items.length) {
            // Automatisch prüfen?
          }
        };
        box.appendChild(div);
      });
      taskArea.appendChild(box);
      break;
      
    default:
      taskArea.innerHTML = `<p>Unbekannter Aufgabentyp: ${t.type}</p>`;
  }
}

function renderChoice(options, name) {
  (options || []).forEach((opt, i) => {
    const label = document.createElement("label");
    label.className = "option";
    label.innerHTML = `<input type="radio" name="${name}" value="${i}"><span>${opt}</span>`;
    taskArea.appendChild(label);
  });
}

function showFallbackChoices(t) {
  state.fallbackMode = true;
  taskArea.innerHTML = "";
  const intro = document.createElement("p");
  intro.className = "supportIntro";
  intro.textContent = t.fallbackIntro || "Wähle nun aus drei möglichen Antworten die passendste aus.";
  taskArea.appendChild(intro);
  renderChoice(t.fallbackChoices || [], "fallbackChoice");
  const fb = $("#feedback");
  fb.textContent = "Hilfestufe: Alle Antworten klingen möglich, aber nur eine erfüllt die Aufgabe wirklich.";
  fb.className = "feedback";
}

function increaseAttempt(t) {
  if (!t || !t.id) return 0;
  state.attempts[t.id] = (state.attempts[t.id] || 0) + 1;
  save();
  return state.attempts[t.id];
}

// ===== CHECK-FUNKTION =====
function check() {
  const t = currentTask();
  if (!t) {
    $("#feedback").textContent = "Keine Aufgabe gefunden.";
    $("#feedback").className = "feedback no";
    return;
  }

  let ok = false;

  // Fallback-Modus
  if (state.fallbackMode) {
    const checked = document.querySelector("input[name='fallbackChoice']:checked");
    if (checked) {
      ok = Number(checked.value) === t.fallbackAnswer;
    }
    if (ok) {
      const fb = $("#feedback");
      fb.textContent = "✓ Richtig. " + (t.feedback || "");
      fb.className = "feedback ok";
      markSolved();
    } else {
      const fb = $("#feedback");
      fb.textContent = "Noch nicht. Die richtige Antwort muss wirklich die andere Perspektive ergänzen, nicht nur die eigene Sicht wiederholen.";
      fb.className = "feedback no";
    }
    return;
  }

  // Normaler Check nach Aufgabentyp
  switch (t.type) {
    case "choice": {
      const c = document.querySelector("input[name='choice']:checked");
      ok = c && Number(c.value) === t.answer;
      break;
    }
    case "cloze": {
      const el = $("#clozeInput");
      if (!el) { ok = false; break; }
      const v = norm(el.value);
      ok = (t.accepted || []).some(a => norm(a) === v);
      break;
    }
    case "match": {
      const selects = document.querySelectorAll(".matchRow select");
      ok = selects.length > 0 && [...selects].every(sel => sel.value === sel.dataset.answer);
      break;
    }
    case "rewrite": {
      const el = $("#rewriteInput");
      if (!el) { ok = false; break; }
      const v = norm(el.value);
      ok = v.length >= 25 && (t.mustContainAny || []).some(w => v.includes(norm(w)));
      break;
    }
    case "sort": {
      ok = JSON.stringify(state.selectedSort) === JSON.stringify(t.answer || []);
      break;
    }
    default:
      ok = false;
  }

  const fb = $("#feedback");
  if (ok) {
    fb.textContent = "✓ Richtig. " + (t.feedback || "");
    fb.className = "feedback ok";
    markSolved();
  } else {
    const attempts = increaseAttempt(t);
    // Fallback nach zu vielen Versuchen
    if ((t.type === "cloze" || t.type === "rewrite") && 
        t.fallbackChoices && 
        attempts >= (t.maxAttempts || 2)) {
      showFallbackChoices(t);
      return;
    }
    fb.textContent = "Noch nicht ganz. Versuche es noch einmal." + 
      (t.fallbackChoices ? " Danach erhältst du drei Antwortmöglichkeiten." : "");
    fb.className = "feedback no";
  }
}

function markSolved() {
  const t = currentTask();
  if (!t) return;
  
  if (!state.solved[t.id]) {
    state.solved[t.id] = true;
    state.score++;
    state.attempts[t.id] = 0;
    
    const st = currentStage();
    if (st) {
      const solvedInStage = st.tasks.filter(x => state.solved[x.id]).length;
      if (solvedInStage >= (st.unlockScore || 0) && st.badge && !state.badges.includes(st.badge)) {
        state.badges.push(st.badge);
        const fb = $("#feedback");
        fb.textContent += ` 🎉 Neues Abzeichen: ${st.badge}`;
      }
    }
    
    // Tracker
    try {
      if (window.ProgressTracker && typeof window.ProgressTracker.sendProgress === 'function') {
        window.ProgressTracker.sendProgress({
          stageId: st?.id || "unknown",
          stageTitle: st?.title || "unknown",
          taskId: t.id,
          taskType: t.type,
          score: state.score,
          badges: state.badges,
          solvedCount: Object.keys(state.solved).length,
          usedFallback: state.fallbackMode
        });
      }
    } catch (e) { /* tracker fail silently */ }
  }
  
  $("#nextBtn").disabled = false;
  $("#checkBtn").disabled = true;
  renderProgress();
  save();
}

function next() {
  const st = currentStage();
  if (!st) return;
  
  if (state.taskIndex < st.tasks.length - 1) {
    state.taskIndex++;
  } else if (state.stageIndex < (state.data?.stages?.length || 0) - 1) {
    state.stageIndex++;
    state.taskIndex = 0;
  } else {
    $("#feedback").textContent = "🎉 Alle Etappen geschafft! Großartige Leistung!";
    $("#feedback").className = "feedback ok";
    $("#nextBtn").disabled = true;
    return;
  }
  render();
}

// ===== PROGRESS RENDER =====
function renderProgress() {
  const all = state.data?.stages?.flatMap(s => s.tasks) || [];
  const solved = Object.keys(state.solved).length;
  const percent = all.length ? Math.round(solved / all.length * 100) : 0;
  
  $("#trackFill").style.width = `${Math.min(percent, 100)}%`;
  $("#walker").style.left = `${Math.min(percent, 100)}%`;
  $("#progressText").textContent = `${solved} von ${all.length} Aufgaben gelöst (${percent}%).`;
  
  const badgeList = $("#badgeList");
  if (state.badges.length) {
    badgeList.innerHTML = state.badges.map(b => `<span class="badge">${b}</span>`).join("");
  } else {
    badgeList.innerHTML = "<span style='color:var(--muted);font-size:.85rem;'>Noch kein Abzeichen.</span>";
  }
  
  const stageDots = $("#stageDots");
  if (state.data?.stages) {
    stageDots.innerHTML = state.data.stages.map((s, i) => {
      const done = state.badges.includes(s.badge);
      return `<span class="${done ? "done" : ""}">${done ? "●" : "○"} ${i + 1}</span>`;
    }).join("");
  }
}

// ===== LOADING =====
function updateLoader(progress) {
  if (loaderBar) loaderBar.style.width = `${Math.min(progress, 100)}%`;
}

// ===== INIT =====
async function init() {
  try {
    updateLoader(10);
    
    // Aufgaben laden
    const r = await fetch("tasks.json");
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    state.data = await r.json();
    updateLoader(60);
    
    // Validierung
    if (!state.data.stages || !Array.isArray(state.data.stages) || state.data.stages.length === 0) {
      throw new Error("Ungültige Aufgabenstruktur: Keine Etappen gefunden.");
    }
    
    // QR-Code
    if (state.data.meta?.qrTarget) {
      renderQr(state.data.meta.qrTarget);
    }
    
    loadSaved();
    updateLoader(90);
    render();
    updateLoader(100);
    
    // Loading Overlay ausblenden
    setTimeout(() => {
      if (loadingOverlay) loadingOverlay.style.display = "none";
    }, 400);
    
  } catch (err) {
    console.error("Init failed:", err);
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `
        <div style="text-align:center;max-width:320px;padding:20px;">
          <div style="font-size:3rem;margin-bottom:12px;">⚠️</div>
          <h3 style="margin:0 0 8px;">Fehler beim Laden</h3>
          <p style="color:var(--muted);font-size:.9rem;">${err.message || "Bitte versuche es später erneut."}</p>
          <button onclick="location.reload()" style="margin-top:16px;padding:10px 24px;border:0;border-radius:12px;background:var(--accent);color:white;font-weight:700;cursor:pointer;">Neu laden</button>
        </div>
      `;
    }
  }
}

// ===== EVENT LISTENER =====
$("#checkBtn").addEventListener("click", check);
$("#nextBtn").addEventListener("click", next);
$("#menuBtn").addEventListener("click", () => $("#drawer").classList.add("open"));
$("#closeMenu").addEventListener("click", () => $("#drawer").classList.remove("open"));

// QR-Code Target öffnen
$("#openQrTarget").addEventListener("click", () => {
  const target = state.data?.meta?.qrTarget;
  if (target) window.open(target, "_blank");
});

// Reset
$("#resetBtn").addEventListener("click", () => {
  if (confirm("Möchtest du wirklich alle Fortschritte zurücksetzen?")) {
    localStorage.removeItem("pwTrainerState");
    location.reload();
  }
});

// Tastatur-Shortcut: Enter für Check
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.target.closest("textarea")) {
    const checkBtn = $("#checkBtn");
    if (!checkBtn.disabled) checkBtn.click();
  }
});

// Start
init();
