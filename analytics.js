/* Perspektivwechsel-Trainer 2.0 Phase 2
   Lernanalyse, Statistik und Reflexion. */
function ensureStats() {
  if (!state.stats || typeof state.stats !== "object") state.stats = {};
  state.stats.byStage ||= {};
  state.stats.byType ||= {};
  state.stats.byDifficulty ||= {};
  state.stats.byCompetency ||= {};
  state.stats.totalWrong ||= 0;
  state.stats.totalSolved ||= 0;
  state.stats.fallbackUsed ||= 0;
  state.stats.confidence ||= [];
  state.stats.history ||= [];
  state.stats.validationReasons ||= {};
}

function bumpStat(bucket, key, field) {
  ensureStats();
  bucket[key] ||= { wrong: 0, solved: 0, fallback: 0, confidence: [] };
  bucket[key][field] = (bucket[key][field] || 0) + 1;
}

function recordAttemptResult(ok, t, usedFallback = false) {
  ensureStats();
  const st = currentStage();
  const sid = st.id, typ = t.type;
  state.stats.byStage[sid] ||= { title: st.title, wrong: 0, solved: 0, fallback: 0, confidence: [] };
  state.stats.byType[typ] ||= { wrong: 0, solved: 0, fallback: 0, confidence: [] };
  const diffKey = String(t.difficulty || 1);
  const compKey = t.competency || "Perspektivwechsel";
  state.stats.byDifficulty[diffKey] ||= { title: typeof difficultyLabel === "function" ? difficultyLabel(t.difficulty) : diffKey, wrong: 0, solved: 0, fallback: 0, confidence: [] };
  state.stats.byCompetency[compKey] ||= { title: compKey, wrong: 0, solved: 0, fallback: 0, confidence: [] };
  if (ok) {
    state.stats.totalSolved++;
    state.stats.byStage[sid].solved++;
    state.stats.byType[typ].solved++;
    state.stats.byDifficulty[diffKey].solved++;
    state.stats.byCompetency[compKey].solved++;
  } else {
    state.stats.totalWrong++;
    state.stats.byStage[sid].wrong++;
    state.stats.byType[typ].wrong++;
    state.stats.byDifficulty[diffKey].wrong++;
    state.stats.byCompetency[compKey].wrong++;
  }
  if (usedFallback) {
    state.stats.fallbackUsed++;
    state.stats.byStage[sid].fallback++;
    state.stats.byType[typ].fallback++;
    state.stats.byDifficulty[diffKey].fallback++;
    state.stats.byCompetency[compKey].fallback++;
  }
  state.stats.history.push({
    ts: Date.now(),
    stageId: sid,
    stageTitle: st.title,
    taskId: t.id,
    taskType: typ,
    competency: t.competency || "",
    difficulty: t.difficulty || 1,
    estimatedTime: t.estimatedTime || "",
    correct: !!ok,
    usedFallback: !!usedFallback,
    confidence: null
  });
  if (state.stats.history.length > 200) state.stats.history = state.stats.history.slice(-200);
  save();
}

function recentHistoryByType(type) {
  ensureStats();
  return (state.stats.history || []).filter(x => x.taskType === type);
}

function trendForType(type) {
  const h = recentHistoryByType(type);
  if (h.length < 6) return null;
  const mid = Math.floor(h.length / 2);
  const first = h.slice(0, mid), last = h.slice(mid);
  const firstErr = first.filter(x => !x.correct).length / Math.max(1, first.length);
  const lastErr = last.filter(x => !x.correct).length / Math.max(1, last.length);
  const delta = firstErr - lastErr;
  if (delta > 0.15) return `Deine Fehlerquote sinkt bei ${typeLabel(type)}-Aufgaben.`;
  if (delta < -0.15) return `Bei ${typeLabel(type)}-Aufgaben treten zuletzt mehr Fehler auf. Lies dort die Hinweise bewusster.`;
  return `Bei ${typeLabel(type)}-Aufgaben ist dein Trend stabil.`;
}

function confidenceCalibration() {
  ensureStats();
  const c = (state.stats.confidence || []).filter(x => typeof x.value === "number");
  if (c.length < 3) return "Noch zu wenige Selbsteinschätzungen für einen sicheren Vergleich.";
  const high = c.filter(x => x.value >= 4);
  const low = c.filter(x => x.value <= 2);
  const highWrong = high.filter(x => x.correct === false).length;
  const lowRight = low.filter(x => x.correct === true).length;
  if (high.length >= 2 && highWrong / high.length > 0.35) return "Du schätzt dich teilweise sicherer ein, als deine Ergebnisse zeigen. Prüfe bei hoher Sicherheit besonders die Aufgabenstellung.";
  if (low.length >= 2 && lowRight / low.length > 0.6) return "Deine Unsicherheit ist oft unbegründet: Du löst mehrere Aufgaben richtig, obwohl du dich niedrig einschätzt.";
  return "Deine Selbsteinschätzung passt bisher recht gut zu deinen Ergebnissen.";
}

function confidenceRecommendation() {
  ensureStats();
  const last = (state.stats.confidence || []).slice(-1)[0];
  if (!last) return "Gib nach gelösten Aufgaben deine Sicherheit an, damit Empfehlungen genauer werden.";
  if (last.value >= 4 && last.correct) return "Hohe Sicherheit + korrekte Lösung: Strategie beibehalten und bewusst benennen.";
  if (last.value >= 4 && !last.correct) return "Hohe Sicherheit + Fehler: Strategie überdenken, Annahmen prüfen und Gegenfrage formulieren.";
  if (last.value <= 2 && last.correct) return "Niedrige Sicherheit + korrekte Lösung: Deine Prüfstrategie funktioniert besser, als du denkst.";
  if (last.value <= 2 && !last.correct) return "Niedrige Sicherheit + Fehler: Gut, dass du vorsichtig warst. Nutze Hinweis oder Hilfestufe früher.";
  return "Mittlere Sicherheit: Vergleiche deine Lösung mit den Prüfkriterien und achte auf wiederkehrende Muster.";
}

function historyForTrend(type) {
  ensureStats();
  return (state.stats.history || []).filter(x => x.taskType === type).slice(-16);
}

function drawSparkline(canvas, values) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#2563eb";
  ctx.beginPath();
  if (!values.length) {
    ctx.fillStyle = "#62708a";
    ctx.font = "11px sans-serif";
    ctx.fillText("zu wenig Daten", 8, 22);
    return;
  }
  values.forEach((v, i) => {
    const x = values.length === 1 ? w / 2 : (i / (values.length - 1)) * (w - 10) + 5;
    const y = h - 5 - (v * (h - 10));
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = "#16a34a";
  values.forEach((v, i) => {
    const x = values.length === 1 ? w / 2 : (i / (values.length - 1)) * (w - 10) + 5;
    const y = h - 5 - (v * (h - 10));
    ctx.beginPath();
    ctx.arc(x, y, 2.3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function addTrendCanvas(parent, type) {
  const h = historyForTrend(type);
  const wrap = document.createElement("div");
  wrap.className = "sparkWrap";
  const label = document.createElement("span");
  label.textContent = typeLabel(type);
  const canvas = document.createElement("canvas");
  canvas.width = 150;
  canvas.height = 34;
  canvas.className = "sparkline";
  wrap.append(label, canvas);
  parent.appendChild(wrap);
  drawSparkline(canvas, h.map(x => x.correct ? 1 : 0));
}

function recordValidationReason(reason) {
  ensureStats();
  if (!reason) return;
  const key = reason.includes("Frage") || reason.includes("Aufforderungsstruktur") ? "frageStruktur"
    : reason.includes("These") || reason.includes("Kontext") ? "kontextFehlt"
    : reason.includes("suggestive") ? "suggestiv"
    : reason.includes("alternative") ? "alternativenFehlen"
    : reason.includes("Handlung") ? "handlungFehlt"
    : "sonstiges";
  state.stats.validationReasons[key] = (state.stats.validationReasons[key] || 0) + 1;
}

function detailedRecommendation() {
  ensureStats();
  const reasons = state.stats.validationReasons || {};
  const top = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0];
  if (top) {
    const [key, count] = top;
    if (key === "frageStruktur") return `Bei Rewrite-Aufgaben fehlt dir häufiger die Frage- oder Aufforderungsstruktur (${count}×). Starte Prompts mit „Welche…“, „Prüfe…“ oder „Analysiere…“.`;
    if (key === "kontextFehlt") return `Du vergisst häufiger, These oder Kontext zu nennen (${count}×). Ein guter Prompt enthält immer den Gegenstand der Prüfung.`;
    if (key === "suggestiv") return `Suggestive Reste tauchen noch auf (${count}×). Entferne Wörter wie „bestätige“, „beweise“ oder „eindeutig“.`;
    if (key === "alternativenFehlen") return `Alternative Erklärungen fehlen noch öfter (${count}×). Ergänze „Welche anderen Erklärungen wären möglich?“.`;
    if (key === "handlungFehlt") return `Deinen Prompts fehlt manchmal eine klare Handlung (${count}×): prüfen, vergleichen, kritisieren oder bewerten.`;
  }
  return "Deine Promptqualität wirkt stabil. Achte weiterhin auf Kontext, Prüfhandlung und nicht-suggestive Formulierungen.";
}

function renderLearningAnalysis() {
  ensureStats();
  const box = document.getElementById("learningAnalysis");
  if (!box) return;
  const entries = Object.entries(state.stats.byStage || {});
  if (!entries.length) {
    box.textContent = "Noch keine Analyse verfügbar.";
    return;
  }
  const weak = entries
    .map(([id, s]) => ({ id, ...s, rate: (s.wrong || 0) / Math.max(1, (s.wrong || 0) + (s.solved || 0)) }))
    .sort((a, b) => b.rate - a.rate)[0];
  const typeEntries = Object.entries(state.stats.byType || {});
  const weakType = typeEntries
    .map(([id, s]) => ({ id, ...s, rate: (s.wrong || 0) / Math.max(1, (s.wrong || 0) + (s.solved || 0)) }))
    .sort((a, b) => b.rate - a.rate)[0];
  const avgConf = state.stats.confidence?.length
    ? (state.stats.confidence.reduce((a, b) => a + b.value, 0) / state.stats.confidence.length).toFixed(1)
    : "–";

  let recommendation = "Weiter so: Nutze bei jeder LLM-Antwort Quellencheck, Gegenargumente und Rollenwechsel.";
  if (weak?.rate > 0.35) recommendation = `Übe besonders: ${weak.title || weak.id}. Dort traten bisher relativ viele Fehlversuche auf.`;
  if ((state.stats.fallbackUsed || 0) >= 3) recommendation += " Du nutzt häufiger Hilfen – lies vor dem Prüfen bewusst den Aufgabenhinweis.";

  const trendTypes = ["rewrite", "choice", "cloze", "match", "sort", "livePaste"];
  const trends = trendTypes.map(trendForType).filter(Boolean).slice(0, 3);
  const calibration = confidenceCalibration();
  const confRec = confidenceRecommendation();
  const detailRec = detailedRecommendation();

  box.innerHTML = "";
  appendText(box, "p", `Gelöst: ${state.stats.totalSolved || 0} · Fehlversuche: ${state.stats.totalWrong || 0} · Hilfen: ${state.stats.fallbackUsed || 0}`);
  const diffWeak = Object.entries(state.stats.byDifficulty || {}).map(([id, s]) => ({ id, ...s, rate: (s.wrong || 0) / Math.max(1, (s.wrong || 0) + (s.solved || 0)) })).sort((a, b) => b.rate - a.rate)[0];
  if (diffWeak) appendText(box, "p", `Aktuell anspruchsvollstes Niveau: ${diffWeak.title || diffWeak.id}.`);
  appendText(box, "p", `Ø Sicherheit: ${avgConf}`);
  if (weakType) appendText(box, "p", `Schwieriger Aufgabentyp: ${typeLabel(weakType.id)}.`);
  appendText(box, "p", recommendation, "analysisRecommendation");

  appendText(box, "strong", "Trend-Analyse", "analysisTitle");
  trends.length ? trends.forEach(t => appendText(box, "p", t, "analysisTrend")) : appendText(box, "p", "Noch zu wenige Daten für stabile Trends.", "analysisTrend");
  const sparkBox = document.createElement("div");
  sparkBox.className = "sparkBox";
  box.appendChild(sparkBox);
  ["rewrite", "choice", "cloze"].forEach(t => addTrendCanvas(sparkBox, t));

  appendText(box, "strong", "Sicherheit vs. Korrektheit", "analysisTitle");
  appendText(box, "p", calibration, "analysisCalibration");

  appendText(box, "strong", "Empfehlung zur Selbsteinschätzung", "analysisTitle");
  appendText(box, "p", confRec, "analysisRecommendation");

  appendText(box, "strong", "Erweiterte Empfehlung", "analysisTitle");
  appendText(box, "p", detailRec, "analysisRecommendation");

  appendText(box, "strong", "Benchmark-Vorbereitung", "analysisTitle");
  appendText(box, "p", "Lokaler Vergleich ist aktiv. Anonymisierte Gruppen-Benchmarks können über den bestehenden Tracker ergänzt werden, sobald ein Dashboard entsprechende Vergleichswerte zurückliefert.", "analysisBenchmark");
}

function renderReflection() {
  const old = document.querySelector(".reflectionBox");
  if (old) old.remove();
  const box = document.createElement("div");
  box.className = "reflectionBox";
  const label = document.createElement("label");
  label.textContent = "Wie sicher bist du, dass deine Antwort gut war?";
  const sel = document.createElement("select");
  sel.id = "confidenceSelect";
  ["", "1 – sehr unsicher", "2 – eher unsicher", "3 – mittel", "4 – eher sicher", "5 – sehr sicher"].forEach((txt, i) => {
    const opt = document.createElement("option");
    opt.value = i === 0 ? "" : String(i);
    opt.textContent = i === 0 ? "Selbsteinschätzung wählen…" : txt;
    sel.appendChild(opt);
  });
  const p = document.createElement("p");
  p.className = "qualityHint";
  p.textContent = "Tipp: Vergleiche deine Sicherheit mit dem Ergebnis. Das hilft, Über- und Unterschätzung zu erkennen.";
  box.append(label, sel, p);
  const actions = document.querySelector(".actions");
  actions.parentNode.insertBefore(box, actions);
  const next = $("#nextBtn");
  next.disabled = true;
  sel.addEventListener("change", e => {
    const val = Number(e.target.value);
    const msg = document.createElement("p");
    msg.className = "reflectionFeedback";
    if (val >= 4) msg.textContent = "Deine hohe Sicherheit war hier gerechtfertigt. Merke dir, welche Strategie funktioniert hat.";
    else if (val <= 2) msg.textContent = "Du warst unsicher, aber deine Lösung war korrekt. Die genutzte Prüfstrategie kann dir künftig Sicherheit geben.";
    else msg.textContent = "Mittlere Sicherheit passt gut zu Prüfaufgaben: Entscheidend ist, welche Strategie du bewusst genutzt hast.";
    const oldMsg = box.querySelector(".reflectionFeedback");
    if (oldMsg) oldMsg.remove();
    box.appendChild(msg);
    ensureStats();
    const t = currentTask();
    const st = currentStage();
    if (!st || !t) {
      next.disabled = false;
      return;
    }
    state.stats.confidence.push({ stageId: st.id, taskId: t.id, taskType: t.type, value: val, correct: true, ts: Date.now() });
    const lastHist = [...(state.stats.history || [])].reverse().find(x => x.taskId === t.id);
    if (lastHist) lastHist.confidence = val;
    state.stats.byStage[st.id] ||= { title: st.title, wrong: 0, solved: 0, fallback: 0, confidence: [] };
    state.stats.byType[t.type] ||= { wrong: 0, solved: 0, fallback: 0, confidence: [] };
    const diffKey = String(t.difficulty || 1);
    const compKey = t.competency || "Perspektivwechsel";
    state.stats.byDifficulty ||= {};
    state.stats.byCompetency ||= {};
    state.stats.byDifficulty[diffKey] ||= { title: typeof difficultyLabel === "function" ? difficultyLabel(t.difficulty) : diffKey, wrong: 0, solved: 0, fallback: 0, confidence: [] };
    state.stats.byCompetency[compKey] ||= { title: compKey, wrong: 0, solved: 0, fallback: 0, confidence: [] };
    state.stats.byStage[st.id].confidence.push(val);
    state.stats.byType[t.type].confidence.push(val);
    state.stats.byDifficulty[diffKey].confidence.push(val);
    state.stats.byCompetency[compKey].confidence.push(val);
    save();
    renderLearningAnalysis();
    ProgressTracker?.sendProgress({ stageId: st.id, taskId: t.id, taskType: t.type, confidence: val, reflection: true, solvedCorrect: true });
    next.disabled = false;
  });
}
