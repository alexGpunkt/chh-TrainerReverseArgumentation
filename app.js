/* Perspektivwechsel-Trainer 2.0 Phase 1
   Schlanker Einstiegspunkt: Laden, Events binden, Anwendung starten. */

async function init() {
  try {
    const r = await fetch("tasks.json");
    if (!r.ok) throw new Error("tasks.json konnte nicht geladen werden");
    state.data = await r.json();

    if (!state.data?.stages?.length) throw new Error("Keine Etappen gefunden");

    loadSaved();

    if (!validateStateIndices()) {
      state.stageIndex = 0;
      state.taskIndex = 0;
    }

    renderQr(state.data.meta?.qrTarget || "");

    const ov = document.getElementById("loadingOverlay");
    if (ov) ov.style.display = "none";

    render();
  } catch (err) {
    document.body.innerHTML = `
      <div style="padding:20px;font-family:sans-serif">
        <h2>Fehler beim Laden</h2>
        <p>${String(err)}</p>
        <button onclick="location.reload()">Neu laden</button>
      </div>
    `;
  }
}

function bindEvents() {
  $("#checkBtn").addEventListener("click", check);
  $("#nextBtn").addEventListener("click", next);
  $("#menuBtn").addEventListener("click", () => $("#drawer").classList.add("open"));
  $("#closeMenu").addEventListener("click", () => $("#drawer").classList.remove("open"));
  $("#openQrTarget").addEventListener("click", () => {
    const url = state.data?.meta?.qrTarget;
    if (url) window.open(url, "_blank");
    else alert("Kein QR-Ziel hinterlegt.");
  });
  $("#resetBtn").addEventListener("click", () => {
    localStorage.removeItem("pwTrainerState");
    location.reload();
  });
  document.getElementById("exportJsonBtn")?.addEventListener("click", () => exportData("json"));
  document.getElementById("exportCsvBtn")?.addEventListener("click", () => exportData("csv"));
}

bindEvents();
init();
