/* Perspektivwechsel-Trainer 2.0 Phase 5
   Darstellung, Aufgaben-Rendering, Navigation und QR-Code. */
function render() {
  const st = currentStage();
  const t = currentTask();
  
  if (!st || !t) {
    document.body.innerHTML = `
      <div style="padding:20px;font-family:sans-serif">
        <h2>Fehler beim Laden der Aufgabe</h2>
        <p>Die Aufgaben konnten nicht geladen werden. Bitte lade die Seite neu.</p>
        <button onclick="location.reload()">Neu laden</button>
      </div>
    `;
    return;
  }
  
  state.fallbackMode = false;
  state.taskStartedAt = Date.now();
  $("#stageTitle").textContent = st.title;
  $("#stageGoal").textContent = st.goal || "";
  $("#prompt").textContent = t.prompt;
  $("#claim").textContent = t.claim || "";
  $("#claim").style.display = t.claim ? "block" : "none";
  $("#taskType").textContent = typeLabel(t.type);
  $("#taskCount").textContent = `${state.taskIndex + 1}/${st.tasks.length}`;
  $("#scorePill").textContent = `${state.score} ✓`;
  $("#feedback").textContent = "";
  $("#feedback").className = "feedback";
  $("#nextBtn").disabled = true;
  $("#checkBtn").disabled = false;
  $("#taskHint").textContent = st.hint;
  state.selectedSort = [];
  ensureLearningPath?.();
  renderProgress();
  renderTask(t);
  save();
}


function renderTaskModelInfo(t) {
  const old = document.querySelector(".taskModelInfo");
  if (old) old.remove();
  if (!t) return;
  const box = document.createElement("div");
  box.className = "taskModelInfo";
  const meta = document.createElement("div");
  meta.className = "taskModelMeta";
  const diff = typeof difficultyLabel === "function" ? difficultyLabel(t.difficulty) : String(t.difficulty || 1);
  meta.innerHTML = `<span>Kompetenz: ${escapeHtml(t.competency || "Perspektivwechsel")}</span><span>Niveau: ${escapeHtml(diff)}</span><span>Zeit: ${Number(t.estimatedTime || 3)} Min.</span>`;
  box.appendChild(meta);
  if (Array.isArray(t.tags) && t.tags.length) {
    const tags = document.createElement("div");
    tags.className = "taskTags";
    t.tags.forEach(tag => {
      const chip = document.createElement("span");
      chip.textContent = String(tag);
      tags.appendChild(chip);
    });
    box.appendChild(tags);
  }
  const prompt = document.createElement("p");
  prompt.className = "qualityHint";
  prompt.textContent = t.reflectionPrompt || "Welche Denkstrategie hast du genutzt?";
  box.appendChild(prompt);
  const claim = document.getElementById("claim");
  claim.insertAdjacentElement("afterend", box);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderContextBlocks(t) {
  if (!Array.isArray(t.contextBlocks)) return;
  const wrap = document.createElement("div");
  wrap.className = "contextBlocks";
  t.contextBlocks.forEach(block => {
    const box = document.createElement("div");
    box.className = "contextBlock";
    const title = document.createElement("strong");
    title.textContent = block.title || "Hinweis";
    const text = document.createElement("p");
    text.textContent = block.text || "";
    box.append(title, text);
    wrap.appendChild(box);
  });
  taskArea.appendChild(wrap);
}

function renderTask(t) {
  taskArea.innerHTML = "";
  if (!t) return;
  renderContextBlocks(t);
  if (t.type === "choice" || t.type === "promptChoice") renderChoice(t.options || [], "choice");
  if (t.type === "cloze") {
    const p = document.createElement("p");
    p.innerHTML = (t.text || "").replace("___", "<strong>_____</strong>");
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Antwort eingeben";
    input.id = "clozeInput";
    taskArea.append(p, input);
  }
  if (t.type === "match") {
    t.pairs.forEach(pair => {
      const row = document.createElement("div");
      row.className = "matchRow";
      const shuffled = [...t.pairs.map(p => p[1])].sort(() => Math.random() - 0.5);
      appendText(row, "strong", pair[0]);
      const sel = document.createElement("select");
      sel.dataset.answer = pair[1];
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Passende Frage wählen…";
      sel.appendChild(placeholder);
      shuffled.forEach(x => {
        const opt = document.createElement("option");
        opt.textContent = String(x);
        opt.value = String(x);
        sel.appendChild(opt);
      });
      row.appendChild(sel);
      taskArea.appendChild(row);
    });
  }
  if (t.type === "rewrite" || t.type === "promptRewrite") {
    const info = document.createElement("p");
    info.className = "qualityHint";
    info.textContent = "Ein guter Prompt nennt die These/den Kontext, fordert Prüfung ein und vermeidet suggestive Wörter wie „bestätige“ oder „beweise“.";
    const ta = document.createElement("textarea");
    ta.id = "rewriteInput";
    ta.placeholder = "Deine umformulierte Version…";
    taskArea.append(info, ta);
  }
  if (t.type === "sort") {
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "miniBtn";
    reset.textContent = "Reihenfolge zurücksetzen";
    reset.onclick = () => render();
    taskArea.appendChild(reset);
    const box = document.createElement("div");
    [...t.items].sort(() => Math.random() - 0.5).forEach(item => {
      const div = document.createElement("button");
      div.type = "button";
      div.className = "sortItem";
      div.textContent = item;
      div.onclick = () => {
        if (state.selectedSort.includes(item)) return;
        state.selectedSort.push(item);
        div.classList.add("active");
        div.textContent = `${state.selectedSort.length}. ${item}`;
      };
      box.appendChild(div);
    });
    taskArea.appendChild(box);
  }
  if (t.type === "livePaste") renderLivePaste(t);
}

function renderChoice(options, name = "choice") {
  options.forEach((opt, i) => {
    const label = document.createElement("label");
    label.className = "option";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = name;
    radio.value = i;
    const span = document.createElement("span");
    span.textContent = String(opt);
    label.append(radio, span);
    taskArea.appendChild(label);
  });
}

function renderLivePaste(t) {
  const box = document.createElement("div");
  box.className = "copyBox";
  const title = document.createElement("strong");
  title.textContent = "Zu kopierender Prompt";
  const p = document.createElement("p");
  p.className = "copyText";
  p.textContent = t.copyPrompt || "";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "miniBtn";
  btn.textContent = "Prompt kopieren";
  btn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(t.copyPrompt || "");
      btn.textContent = "Kopiert ✓";
    } catch (e) {
      btn.textContent = "Manuell kopieren";
    }
  };
  const guide = document.createElement("p");
  guide.className = "qualityHint";
  guide.textContent = "1. Prompt kopieren → 2. In ChatGPT/Copilot/Claude einfügen → 3. Antwort kopieren → 4. Hier einfügen.";
  box.append(title, p, btn, guide);
  const ta = document.createElement("textarea");
  ta.id = "pasteInput";
  ta.placeholder = "LLM-Antwort hier einfügen…";
  const q = document.createElement("p");
  q.className = "qualityHint";
  q.textContent = t.evaluationQuestion || "Bewerte die Antwort.";
  taskArea.append(box, ta, q);
  renderChoice(t.options || [], "liveChoice");
}

function showFallbackChoices(t) {
  state.fallbackMode = true;
  taskArea.innerHTML = "";
  const intro = document.createElement("p");
  intro.className = "supportIntro";
  intro.textContent = t.fallbackIntro || "Wähle nun aus drei möglichen Antworten die passendste aus.";
  taskArea.appendChild(intro);
  renderChoice(t.fallbackChoices, "fallbackChoice");
  const fb = $("#feedback");
  fb.textContent = "Hilfestufe: Alle Antworten klingen möglich, aber nur eine erfüllt die Aufgabe wirklich.";
  fb.className = "feedback";
}

function check() {
  const t = currentTask();
  if (!t) {
    $("#feedback").textContent = "Fehler: Aufgabe nicht gefunden. Bitte lade die Seite neu.";
    $("#feedback").className = "feedback no";
    return;
  }
  
  let ok = false;
  
  if (state.fallbackMode) {
    const checked = document.querySelector("input[name='fallbackChoice']:checked");
    ok = checked && Number(checked.value) === t.fallbackAnswer;
    if (ok) {
      const fb = $("#feedback");
      fb.textContent = "✓ Richtig. " + (t.feedback || "");
      fb.className = "feedback ok";
      recordLearningPathAttempt?.(true, t, true);
      markSolved();
    } else {
      const fb = $("#feedback");
      fb.textContent = "Noch nicht. Die richtige Antwort muss wirklich die andere Perspektive ergänzen, nicht nur die eigene Sicht wiederholen.";
      fb.className = "feedback no";
      recordAttemptResult(false, t, true);
      recordLearningPathAttempt?.(false, t, true);
    }
    return;
  }
  
  if (t.type === "choice" || t.type === "promptChoice") {
    const c = document.querySelector("input[name='choice']:checked");
    ok = c && Number(c.value) === t.answer;
  }
  
  if (t.type === "cloze") {
    const v = norm($("#clozeInput").value);
    ok = (t.accepted || []).some(a => norm(a) === v);
  }
  
  if (t.type === "match") {
    ok = [...document.querySelectorAll(".matchRow select")].every(sel => sel.value === sel.dataset.answer);
  }
  
  let rewriteReason = "";
  if (t.type === "rewrite" || t.type === "promptRewrite") {
    const el = $("#rewriteInput");
    const res = validateRewrite(t, el ? el.value : "");
    ok = res.ok;
    rewriteReason = res.reason;
  }
  
  if (t.type === "sort") {
    ok = JSON.stringify(state.selectedSort) === JSON.stringify(t.answer);
  }
  
  if (t.type === "livePaste") {
    const pasted = ($("#pasteInput")?.value || "").trim();
    const c = document.querySelector("input[name='liveChoice']:checked");
    ok = pasted.length >= (t.minPasteLength || 60) && c && Number(c.value) === t.answer;
    if (pasted.length < (t.minPasteLength || 60)) rewriteReason = "Füge zuerst eine echte oder ausreichend lange Beispielantwort ein.";
  }
  
  const fb = $("#feedback");
  if (ok) {
    fb.textContent = "✓ Richtig. " + (t.feedback || "");
    fb.className = "feedback ok";
    markSolved();
  } else {
    recordValidationReason(rewriteReason);
    const attempts = increaseAttempt(t);
    recordAttemptResult(false, t, false);
    recordLearningPathAttempt?.(false, t, false);
    if ((t.type === "cloze" || t.type === "rewrite" || t.type === "promptRewrite") && t.fallbackChoices && attempts >= (t.maxAttempts || 2)) {
      showFallbackChoices(t);
      recordAttemptResult(false, t, true);
      return;
    }
    fb.textContent = rewriteReason || "Noch nicht ganz. Versuche es noch einmal. Danach erhältst du drei Antwortmöglichkeiten.";
    fb.className = "feedback no";
  }
}

function markSolved() {
  const st = currentStage();
  const t = currentTask();
  if (!st || !t) return;
  
  if (!state.solved[t.id]) {
    if (!state.fallbackMode) recordLearningPathAttempt?.(true, t, false);
    recordAttemptResult(true, t, state.fallbackMode);
    state.solved[t.id] = true;
    state.score++;
    state.attempts[t.id] = 0;
    const solvedInStage = st.tasks.filter(x => state.solved[x.id]).length;
    if (solvedInStage >= st.unlockScore && !state.badges.includes(st.badge)) {
      state.badges.push(st.badge);
      $("#feedback").textContent += ` Neues Abzeichen: ${st.badge}`;
    }
    ProgressTracker?.sendProgress({
      stageId: st.id,
      stageTitle: st.title,
      taskId: t.id,
      taskType: t.type,
      competency: t.competency,
      difficulty: t.difficulty,
      score: state.score,
      badges: state.badges,
      solvedCount: Object.keys(state.solved).length,
      usedFallback: state.fallbackMode
    });
  }
  $("#checkBtn").disabled = true;
  renderProgress();
  renderReflection();
  save();
}

function next() {
  const st = currentStage();
  if (!st) return;
  
  const pos = nextAdaptivePosition?.();
  if (pos) {
    state.stageIndex = pos.stageIndex;
    state.taskIndex = pos.taskIndex;
    render();
    return;
  }
  $("#feedback").textContent = "Alle Etappen geschafft.";
  $("#feedback").className = "feedback ok";
}

function renderProgress() {
  const all = state.data.stages.flatMap(s => s.tasks);
  const solved = Object.keys(state.solved).length;
  const percent = all.length ? Math.round(solved / all.length * 100) : 0;
  $("#trackFill").style.width = `${percent}%`;
  $("#walker").style.left = `${percent}%`;
  $("#progressText").textContent = `${solved} von ${all.length} Aufgaben gelöst (${percent}%).`;
  $("#badgeList").innerHTML = state.badges.length ? state.badges.map(b => `<span class="badge">${b}</span>`).join("") : "<span>Noch kein Abzeichen.</span>";
  $("#stageDots").innerHTML = state.data.stages.map((s, i) => {
    const done = state.badges.includes(s.badge);
    return `<span class="${done ? "done" : ""}">${done ? "●" : "○"} ${i + 1}</span>`;
  }).join("");
  renderLearningAnalysis();
  renderPhase4Dashboard?.();
  renderPhase4Errors?.();
  renderPhase4History?.();
  renderCompetencyMap?.();
  renderLearningPathRecommendation?.();
  renderPhase5?.();
}

function renderQr(text) {
  const c = $("#qrCanvas");
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  const size = 8;
  let seed = 0;
  for (let ch of text) seed = (seed + ch.charCodeAt(0) * 17) % 9973;
  ctx.fillStyle = "#111827";
  for (let y = 0; y < 17; y++) {
    for (let x = 0; x < 17; x++) {
      const on = (x < 4 && y < 4) || (x > 12 && y < 4) || (x < 4 && y > 12) || ((x * y + seed + x + y * 3) % 5 === 0);
      if (on) ctx.fillRect(14 + x * size, 14 + y * size, size - 1, size - 1);
    }
  }
}