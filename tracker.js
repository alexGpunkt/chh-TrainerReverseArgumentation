const DASHBOARD_ENDPOINT = ""; // z.B. "https://dein-dashboard.example/track"

window.ProgressTracker = {
  async sendProgress(payload){
    const enriched = {
      app: "perspektivwechsel-trainer",
      timestamp: new Date().toISOString(),
      ...payload
    };
    console.log("Tracker-Daten:", enriched);
    if(!DASHBOARD_ENDPOINT) return {ok:false, skipped:true};
    try{
      const res = await fetch(DASHBOARD_ENDPOINT, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(enriched),
        keepalive: true
      });
      return {ok:res.ok};
    }catch(err){
      console.warn("Tracker nicht erreichbar:", err);
      return {ok:false, error:String(err)};
    }
  }
};
