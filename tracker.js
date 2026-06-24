const DASHBOARD_ENDPOINT = ""; // z.B. "https://dein-dashboard.example/track"

window.ProgressTracker = {
  async sendProgress(payload) {
    const enriched = {
      app: "perspektivwechsel-trainer",
      version: "1.1",
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.slice(0, 100),
      ...payload
    };
    
    console.log("📊 Tracker-Daten:", enriched);
    
    if (!DASHBOARD_ENDPOINT) {
      return { ok: false, skipped: true, message: "Kein Endpoint konfiguriert" };
    }
    
    try {
      const res = await fetch(DASHBOARD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enriched),
        keepalive: true
      });
      return { ok: res.ok, status: res.status };
    } catch (err) {
      console.warn("Tracker nicht erreichbar:", err.message);
      return { ok: false, error: String(err) };
    }
  }
};
