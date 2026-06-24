const state={data:null,stageIndex:0,taskIndex:0,score:0,solved:{},badges:[],selectedSort:[],attempts:{},fallbackMode:false,stats:{}};
const $=s=>document.querySelector(s);const taskArea=$("#taskArea");
function save(){localStorage.setItem("pwTrainerState",JSON.stringify({stageIndex:state.stageIndex,taskIndex:state.taskIndex,score:state.score,solved:state.solved,badges:state.badges,attempts:state.attempts,stats:state.stats}))}
function loadSaved(){try{
 const s=JSON.parse(localStorage.getItem("pwTrainerState")||"{}");
 if(typeof s.stageIndex==="number") state.stageIndex=s.stageIndex;
 if(typeof s.taskIndex==="number") state.taskIndex=s.taskIndex;
 if(typeof s.score==="number") state.score=s.score;
 if(s.solved&&typeof s.solved==="object") state.solved=s.solved;
 if(Array.isArray(s.badges)) state.badges=s.badges;
 if(s.attempts&&typeof s.attempts==="object") state.attempts=s.attempts;
 if(s.stats&&typeof s.stats==="object") state.stats=s.stats;
}catch(e){console.warn("save corrupt",e)}}
function norm(s){return String(s||"").toLowerCase().trim().replaceAll("ä","ae").replaceAll("ö","oe").replaceAll("ü","ue").replaceAll("ß","ss")}
async function init(){try{
 const r=await fetch("tasks.json");
 if(!r.ok) throw new Error("tasks.json konnte nicht geladen werden");
 state.data=await r.json();
 loadSaved();
 if(!state.data?.stages?.length) throw new Error("Keine Etappen gefunden");
 if(state.stageIndex>=state.data.stages.length){state.stageIndex=0;state.taskIndex=0;}
 renderQr(state.data.meta?.qrTarget||"");
 const ov=document.getElementById("loadingOverlay"); if(ov) ov.style.display="none";
 render();
}catch(err){
 document.body.innerHTML='<div style="padding:20px;font-family:sans-serif"><h2>Fehler beim Laden</h2><p>'+String(err)+'</p><button onclick="location.reload()">Neu laden</button></div>';
}}
function currentStage(){return state.data.stages[state.stageIndex]}function currentTask(){return currentStage().tasks[state.taskIndex]}
function render(){const st=currentStage(),t=currentTask();state.fallbackMode=false;$("#stageTitle").textContent=st.title;$("#stageGoal").textContent=st.goal||"";$("#prompt").textContent=t.prompt;$("#claim").textContent=t.claim||"";$("#claim").style.display=t.claim?"block":"none";$("#taskType").textContent=typeLabel(t.type);$("#taskCount").textContent=`${state.taskIndex+1}/${st.tasks.length}`;$("#scorePill").textContent=`${state.score} ✓`;$("#feedback").textContent="";$("#feedback").className="feedback";$("#nextBtn").disabled=true;$("#checkBtn").disabled=false;$("#taskHint").textContent=st.hint;state.selectedSort=[];renderProgress();renderTask(t);save()}
function typeLabel(t){return{choice:"Auswahl",cloze:"Lücke",match:"Zuordnung",rewrite:"Umformulieren",sort:"Reihenfolge",promptChoice:"Promptwahl",promptRewrite:"Prompt verbessern",livePaste:"Live-Check"}[t]||"Aufgabe"}
function appendText(parent, tag, text, className){
  const el=document.createElement(tag);
  if(className) el.className=className;
  el.textContent=String(text||"");
  parent.appendChild(el);
  return el;
}
function ensureStats(){
  if(!state.stats || typeof state.stats!=="object") state.stats={};
  state.stats.byStage ||= {};
  state.stats.byType ||= {};
  state.stats.totalWrong ||= 0;
  state.stats.totalSolved ||= 0;
  state.stats.fallbackUsed ||= 0;
  state.stats.confidence ||= [];
  state.stats.history ||= [];
  state.stats.validationReasons ||= {};
}
function bumpStat(bucket,key,field){
  ensureStats();
  bucket[key] ||= {wrong:0,solved:0,fallback:0,confidence:[]};
  bucket[key][field] = (bucket[key][field]||0)+1;
}
function recordAttemptResult(ok,t,usedFallback=false){
  ensureStats();
  const st=currentStage();
  const sid=st.id, typ=t.type;
  state.stats.byStage[sid] ||= {title:st.title,wrong:0,solved:0,fallback:0,confidence:[]};
  state.stats.byType[typ] ||= {wrong:0,solved:0,fallback:0,confidence:[]};
  if(ok){
    state.stats.totalSolved++;
    state.stats.byStage[sid].solved++;
    state.stats.byType[typ].solved++;
  }else{
    state.stats.totalWrong++;
    state.stats.byStage[sid].wrong++;
    state.stats.byType[typ].wrong++;
  }
  if(usedFallback){
    state.stats.fallbackUsed++;
    state.stats.byStage[sid].fallback++;
    state.stats.byType[typ].fallback++;
  }
  state.stats.history.push({
    ts:Date.now(),
    stageId:sid,
    stageTitle:st.title,
    taskId:t.id,
    taskType:typ,
    correct:!!ok,
    usedFallback:!!usedFallback,
    confidence:null
  });
  if(state.stats.history.length>200) state.stats.history=state.stats.history.slice(-200);
  save();
}
function recentHistoryByType(type){
  ensureStats();
  return (state.stats.history||[]).filter(x=>x.taskType===type);
}
function trendForType(type){
  const h=recentHistoryByType(type);
  if(h.length<6) return null;
  const mid=Math.floor(h.length/2);
  const first=h.slice(0,mid), last=h.slice(mid);
  const firstErr=first.filter(x=>!x.correct).length/Math.max(1,first.length);
  const lastErr=last.filter(x=>!x.correct).length/Math.max(1,last.length);
  const delta=firstErr-lastErr;
  if(delta>0.15) return `Deine Fehlerquote sinkt bei ${typeLabel(type)}-Aufgaben.`;
  if(delta<-0.15) return `Bei ${typeLabel(type)}-Aufgaben treten zuletzt mehr Fehler auf. Lies dort die Hinweise bewusster.`;
  return `Bei ${typeLabel(type)}-Aufgaben ist dein Trend stabil.`;
}
function confidenceCalibration(){
  ensureStats();
  const c=(state.stats.confidence||[]).filter(x=>typeof x.value==="number");
  if(c.length<3) return "Noch zu wenige Selbsteinschätzungen für einen sicheren Vergleich.";
  const high=c.filter(x=>x.value>=4);
  const low=c.filter(x=>x.value<=2);
  const highWrong=high.filter(x=>x.correct===false).length;
  const lowRight=low.filter(x=>x.correct===true).length;
  if(high.length>=2 && highWrong/high.length>0.35) return "Du schätzt dich teilweise sicherer ein, als deine Ergebnisse zeigen. Prüfe bei hoher Sicherheit besonders die Aufgabenstellung.";
  if(low.length>=2 && lowRight/low.length>0.6) return "Deine Unsicherheit ist oft unbegründet: Du löst mehrere Aufgaben richtig, obwohl du dich niedrig einschätzt.";
  return "Deine Selbsteinschätzung passt bisher recht gut zu deinen Ergebnissen.";
}
function confidenceRecommendation(){
  ensureStats();
  const last=(state.stats.confidence||[]).slice(-1)[0];
  if(!last) return "Gib nach gelösten Aufgaben deine Sicherheit an, damit Empfehlungen genauer werden.";
  if(last.value>=4 && last.correct) return "Hohe Sicherheit + korrekte Lösung: Strategie beibehalten und bewusst benennen.";
  if(last.value>=4 && !last.correct) return "Hohe Sicherheit + Fehler: Strategie überdenken, Annahmen prüfen und Gegenfrage formulieren.";
  if(last.value<=2 && last.correct) return "Niedrige Sicherheit + korrekte Lösung: Deine Prüfstrategie funktioniert besser, als du denkst.";
  if(last.value<=2 && !last.correct) return "Niedrige Sicherheit + Fehler: Gut, dass du vorsichtig warst. Nutze Hinweis oder Hilfestufe früher.";
  return "Mittlere Sicherheit: Vergleiche deine Lösung mit den Prüfkriterien und achte auf wiederkehrende Muster.";
}
function historyForTrend(type){
  ensureStats();
  return (state.stats.history||[]).filter(x=>x.taskType===type).slice(-16);
}
function drawSparkline(canvas, values){
  if(!canvas || !canvas.getContext) return;
  const ctx=canvas.getContext("2d");
  const w=canvas.width, h=canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.lineWidth=2;
  ctx.strokeStyle="#2563eb";
  ctx.beginPath();
  if(!values.length){
    ctx.fillStyle="#62708a";
    ctx.font="11px sans-serif";
    ctx.fillText("zu wenig Daten",8,22);
    return;
  }
  values.forEach((v,i)=>{
    const x=values.length===1?w/2:(i/(values.length-1))*(w-10)+5;
    const y=h-5-(v*(h-10));
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();
  ctx.fillStyle="#16a34a";
  values.forEach((v,i)=>{
    const x=values.length===1?w/2:(i/(values.length-1))*(w-10)+5;
    const y=h-5-(v*(h-10));
    ctx.beginPath();ctx.arc(x,y,2.3,0,Math.PI*2);ctx.fill();
  });
}
function addTrendCanvas(parent,type){
  const h=historyForTrend(type);
  const wrap=document.createElement("div");
  wrap.className="sparkWrap";
  const label=document.createElement("span");
  label.textContent=typeLabel(type);
  const canvas=document.createElement("canvas");
  canvas.width=150;canvas.height=34;canvas.className="sparkline";
  wrap.append(label,canvas);
  parent.appendChild(wrap);
  drawSparkline(canvas,h.map(x=>x.correct?1:0));
}
function recordValidationReason(reason){
  ensureStats();
  if(!reason) return;
  const key=reason.includes("Frage")||reason.includes("Aufforderungsstruktur") ? "frageStruktur"
    : reason.includes("These")||reason.includes("Kontext") ? "kontextFehlt"
    : reason.includes("suggestive") ? "suggestiv"
    : reason.includes("alternative") ? "alternativenFehlen"
    : reason.includes("Handlung") ? "handlungFehlt"
    : "sonstiges";
  state.stats.validationReasons[key]=(state.stats.validationReasons[key]||0)+1;
}
function detailedRecommendation(){
  ensureStats();
  const reasons=state.stats.validationReasons||{};
  const top=Object.entries(reasons).sort((a,b)=>b[1]-a[1])[0];
  if(top){
    const [key,count]=top;
    if(key==="frageStruktur") return `Bei Rewrite-Aufgaben fehlt dir häufiger die Frage- oder Aufforderungsstruktur (${count}×). Starte Prompts mit „Welche…“, „Prüfe…“ oder „Analysiere…“.`;
    if(key==="kontextFehlt") return `Du vergisst häufiger, These oder Kontext zu nennen (${count}×). Ein guter Prompt enthält immer den Gegenstand der Prüfung.`;
    if(key==="suggestiv") return `Suggestive Reste tauchen noch auf (${count}×). Entferne Wörter wie „bestätige“, „beweise“ oder „eindeutig“.`;
    if(key==="alternativenFehlen") return `Alternative Erklärungen fehlen noch öfter (${count}×). Ergänze „Welche anderen Erklärungen wären möglich?“.`;
    if(key==="handlungFehlt") return `Deinen Prompts fehlt manchmal eine klare Handlung (${count}×): prüfen, vergleichen, kritisieren oder bewerten.`;
  }
  return "Deine Promptqualität wirkt stabil. Achte weiterhin auf Kontext, Prüfhandlung und nicht-suggestive Formulierungen.";
}
function exportData(format){
  ensureStats();
  const payload={app:"perspektivwechsel-trainer",version:state.data?.meta?.version||"",exportedAt:new Date().toISOString(),stats:state.stats,solved:state.solved,badges:state.badges};
  let blob,name;
  if(format==="csv"){
    const rows=[["timestamp","stageId","taskId","taskType","correct","usedFallback","confidence"]];
    (state.stats.history||[]).forEach(h=>rows.push([new Date(h.ts).toISOString(),h.stageId,h.taskId,h.taskType,h.correct,h.usedFallback,h.confidence??""]));
    const csv=rows.map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(",")).join("\n");
    blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    name="perspektivwechsel_lernpfad.csv";
  }else{
    blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"});
    name="perspektivwechsel_lernpfad.json";
  }
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=name;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}
function renderLearningAnalysis(){
  ensureStats();
  const box=document.getElementById("learningAnalysis");
  if(!box) return;
  const entries=Object.entries(state.stats.byStage||{});
  if(!entries.length){
    box.textContent="Noch keine Analyse verfügbar.";
    return;
  }
  const weak=entries
    .map(([id,s])=>({id,...s,rate:(s.wrong||0)/Math.max(1,(s.wrong||0)+(s.solved||0))}))
    .sort((a,b)=>b.rate-a.rate)[0];
  const typeEntries=Object.entries(state.stats.byType||{});
  const weakType=typeEntries
    .map(([id,s])=>({id,...s,rate:(s.wrong||0)/Math.max(1,(s.wrong||0)+(s.solved||0))}))
    .sort((a,b)=>b.rate-a.rate)[0];
  const avgConf=state.stats.confidence?.length
    ? (state.stats.confidence.reduce((a,b)=>a+b.value,0)/state.stats.confidence.length).toFixed(1)
    : "–";

  let recommendation="Weiter so: Nutze bei jeder LLM-Antwort Quellencheck, Gegenargumente und Rollenwechsel.";
  if(weak?.rate>0.35) recommendation=`Übe besonders: ${weak.title || weak.id}. Dort traten bisher relativ viele Fehlversuche auf.`;
  if((state.stats.fallbackUsed||0)>=3) recommendation+=" Du nutzt häufiger Hilfen – lies vor dem Prüfen bewusst den Aufgabenhinweis.";

  const trendTypes=["rewrite","choice","cloze","match","sort","livePaste"];
  const trends=trendTypes.map(trendForType).filter(Boolean).slice(0,3);
  const calibration=confidenceCalibration();
  const confRec=confidenceRecommendation();
  const detailRec=detailedRecommendation();

  box.innerHTML="";
  appendText(box,"p",`Gelöst: ${state.stats.totalSolved||0} · Fehlversuche: ${state.stats.totalWrong||0} · Hilfen: ${state.stats.fallbackUsed||0}`);
  appendText(box,"p",`Ø Sicherheit: ${avgConf}`);
  if(weakType) appendText(box,"p",`Schwieriger Aufgabentyp: ${typeLabel(weakType.id)}.`);
  appendText(box,"p",recommendation,"analysisRecommendation");

  appendText(box,"strong","Trend-Analyse","analysisTitle");
  trends.length ? trends.forEach(t=>appendText(box,"p",t,"analysisTrend")) : appendText(box,"p","Noch zu wenige Daten für stabile Trends.","analysisTrend");
  const sparkBox=document.createElement("div");
  sparkBox.className="sparkBox";
  box.appendChild(sparkBox);
  ["rewrite","choice","cloze"].forEach(t=>addTrendCanvas(sparkBox,t));

  appendText(box,"strong","Sicherheit vs. Korrektheit","analysisTitle");
  appendText(box,"p",calibration,"analysisCalibration");

  appendText(box,"strong","Empfehlung zur Selbsteinschätzung","analysisTitle");
  appendText(box,"p",confRec,"analysisRecommendation");

  appendText(box,"strong","Erweiterte Empfehlung","analysisTitle");
  appendText(box,"p",detailRec,"analysisRecommendation");

  appendText(box,"strong","Benchmark-Vorbereitung","analysisTitle");
  appendText(box,"p","Lokaler Vergleich ist aktiv. Anonymisierte Gruppen-Benchmarks können über den bestehenden Tracker ergänzt werden, sobald ein Dashboard entsprechende Vergleichswerte zurückliefert.","analysisBenchmark");
}
function renderContextBlocks(t){if(!Array.isArray(t.contextBlocks))return;const wrap=document.createElement("div");wrap.className="contextBlocks";t.contextBlocks.forEach(block=>{const box=document.createElement("div");box.className="contextBlock";const title=document.createElement("strong");title.textContent=block.title||"Hinweis";const text=document.createElement("p");text.textContent=block.text||"";box.append(title,text);wrap.appendChild(box)});taskArea.appendChild(wrap)}
function renderTask(t){taskArea.innerHTML="";if(!t)return;renderContextBlocks(t);if(t.type==="choice"||t.type==="promptChoice")renderChoice(t.options||[],"choice");if(t.type==="cloze"){const p=document.createElement("p");p.innerHTML=(t.text||"").replace("___","<strong>_____</strong>");const input=document.createElement("input");input.type="text";input.placeholder="Antwort eingeben";input.id="clozeInput";taskArea.append(p,input)}if(t.type==="match"){t.pairs.forEach(pair=>{const row=document.createElement("div");row.className="matchRow";const shuffled=[...t.pairs.map(p=>p[1])].sort(()=>Math.random()-.5);appendText(row,"strong",pair[0]);const sel=document.createElement("select");sel.dataset.answer=pair[1];const placeholder=document.createElement("option");
placeholder.value="";
placeholder.textContent="Passende Frage wählen…";
sel.appendChild(placeholder);
shuffled.forEach(x=>{const opt=document.createElement("option");opt.textContent=String(x);opt.value=String(x);sel.appendChild(opt);});
row.appendChild(sel);taskArea.appendChild(row)})}if(t.type==="rewrite"||t.type==="promptRewrite"){const info=document.createElement("p");info.className="qualityHint";info.textContent="Ein guter Prompt nennt die These/den Kontext, fordert Prüfung ein und vermeidet suggestive Wörter wie „bestätige“ oder „beweise“.";const ta=document.createElement("textarea");ta.id="rewriteInput";ta.placeholder="Deine umformulierte Version…";taskArea.append(info,ta)}if(t.type==="sort"){const reset=document.createElement("button");reset.type="button";reset.className="miniBtn";reset.textContent="Reihenfolge zurücksetzen";reset.onclick=()=>render();taskArea.appendChild(reset);const box=document.createElement("div");[...t.items].sort(()=>Math.random()-.5).forEach(item=>{const div=document.createElement("button");div.type="button";div.className="sortItem";div.textContent=item;div.onclick=()=>{if(state.selectedSort.includes(item))return;state.selectedSort.push(item);div.classList.add("active");div.textContent=`${state.selectedSort.length}. ${item}`};box.appendChild(div)});taskArea.appendChild(box)}if(t.type==="livePaste")renderLivePaste(t)}
function renderChoice(options,name="choice"){
 options.forEach((opt,i)=>{
  const label=document.createElement("label");label.className="option";
  const radio=document.createElement("input");radio.type="radio";radio.name=name;radio.value=i;
  const span=document.createElement("span");span.textContent=String(opt);
  label.append(radio,span);taskArea.appendChild(label);
 })
}" value="${i}"><span>${opt}</span>`;taskArea.appendChild(label)})}
function renderLivePaste(t){const box=document.createElement("div");box.className="copyBox";const title=document.createElement("strong");title.textContent="Zu kopierender Prompt";const p=document.createElement("p");p.className="copyText";p.textContent=t.copyPrompt||"";const btn=document.createElement("button");btn.type="button";btn.className="miniBtn";btn.textContent="Prompt kopieren";btn.onclick=async()=>{try{await navigator.clipboard.writeText(t.copyPrompt||"");btn.textContent="Kopiert ✓"}catch(e){btn.textContent="Manuell kopieren"}};const guide=document.createElement("p");
guide.className="qualityHint";
guide.textContent="1. Prompt kopieren → 2. In ChatGPT/Copilot/Claude einfügen → 3. Antwort kopieren → 4. Hier einfügen.";
box.append(title,p,btn,guide);const ta=document.createElement("textarea");ta.id="pasteInput";ta.placeholder="LLM-Antwort hier einfügen…";const q=document.createElement("p");q.className="qualityHint";q.textContent=t.evaluationQuestion||"Bewerte die Antwort.";taskArea.append(box,ta,q);renderChoice(t.options||[],"liveChoice")}
function showFallbackChoices(t){state.fallbackMode=true;taskArea.innerHTML="";const intro=document.createElement("p");intro.className="supportIntro";intro.textContent=t.fallbackIntro||"Wähle nun aus drei möglichen Antworten die passendste aus.";taskArea.appendChild(intro);renderChoice(t.fallbackChoices,"fallbackChoice");const fb=$("#feedback");fb.textContent="Hilfestufe: Alle Antworten klingen möglich, aber nur eine erfüllt die Aufgabe wirklich.";fb.className="feedback"}
function increaseAttempt(t){state.attempts[t.id]=(state.attempts[t.id]||0)+1;save();return state.attempts[t.id]}
function hasQuestionWord(v){
  const words=["welche","welcher","welches","warum","wann","wie","wo","wodurch","inwiefern","unter welchen","nenne","prüfe","pruefe","kritisiere","analysiere","wechsle","vergleiche","bewerte"];
  return words.some(w=>v.includes(w));
}
function hasQuestionStructure(raw){
  const s=String(raw||"").trim().toLowerCase();
  return /\?$/.test(s) || /^(welche|welcher|welches|warum|wann|wie|wo|wodurch|inwiefern|unter welchen)\b/.test(s) || /^(nenne|prüfe|pruefe|analysiere|kritisiere|vergleiche|bewerte|untersuche|wechsle)\b/.test(s);
}
function hasAlternativeLanguage(v){
  const words=["alternative erklärungen","alternative erklaerungen","andere erklärungen","andere erklaerungen","andere gründe","andere gruende","andere hypothesen","alternativen"];
  return words.some(w=>v.includes(w));
}
function hasPromptAction(v){
  const verbs=["nenne","prüfe","pruefe","analysiere","kritisiere","vergleiche","bewerte","untersuche","wechsle","formuliere","zeige","erkläre","erklaere"];
  return verbs.some(w=>v.includes(w));
}
function validateRewrite(t,value){
  const v=norm(value);
  const min=t.minLength||25;
  const hasKey=!t.mustContainAny||t.mustContainAny.some(w=>v.includes(norm(w)));
  const hasNoBad=!t.mustNotContain||!t.mustNotContain.some(w=>v.includes(norm(w)));
  const hasClaim=!t.mustContainClaimTermAny||t.mustContainClaimTermAny.some(w=>v.includes(norm(w)));
  const hasQ=!t.mustContainQuestionWord||hasQuestionWord(v)||hasQuestionStructure(value);
  const hasAlt=!t.mustContainAlternativeExplanations||hasAlternativeLanguage(v);
  const actionOk=hasPromptAction(v)||hasQuestionStructure(value);
  const structureOk=!t.mustContainQuestionWord||hasQuestionStructure(value);
  return{
    ok:v.length>=min&&hasKey&&hasNoBad&&hasClaim&&hasQ&&hasAlt&&actionOk&&structureOk,
    reason:!hasNoBad?"Entferne suggestive Wörter wie „bestätige“, „beweise“ oder eindeutige Vorannahmen."
      :!hasClaim?"Nenne die These oder den Kontext im Prompt ausdrücklich."
      :!structureOk?"Der Prompt braucht eine erkennbare Frage- oder Aufforderungsstruktur, z. B. „Welche…?“, „Prüfe…“, „Analysiere…“."
      :!hasQ?"Formuliere als echte Prüf- oder Fragehandlung: z. B. „Welche…?“, „Warum…?“, „Prüfe…“."
      :!hasAlt?"Fordere ausdrücklich alternative Erklärungen oder andere Hypothesen ein."
      :!actionOk?"Der Prompt braucht eine klare Handlung: prüfen, analysieren, kritisieren, vergleichen oder bewerten."
      :!hasKey?"Fordere Gegenargumente, Bedingungen, Grenzen, Quellen, Rollenwechsel oder Alternativerklärungen ein."
      :v.length<min?"Formuliere vollständiger: Ein guter Prompt enthält Kontext und Prüfauftrag.":""
  }
}
function renderReflection(){
  const old=document.querySelector(".reflectionBox");
  if(old) old.remove();
  const box=document.createElement("div");
  box.className="reflectionBox";
  const label=document.createElement("label");
  label.textContent="Wie sicher bist du, dass deine Antwort gut war?";
  const sel=document.createElement("select");
  sel.id="confidenceSelect";
  ["","1 – sehr unsicher","2 – eher unsicher","3 – mittel","4 – eher sicher","5 – sehr sicher"].forEach((txt,i)=>{
    const opt=document.createElement("option");
    opt.value=i===0?"":String(i);
    opt.textContent=i===0?"Selbsteinschätzung wählen…":txt;
    sel.appendChild(opt);
  });
  const p=document.createElement("p");
  p.className="qualityHint";
  p.textContent="Tipp: Vergleiche deine Sicherheit mit dem Ergebnis. Das hilft, Über- und Unterschätzung zu erkennen.";
  box.append(label,sel,p);
  const actions=document.querySelector(".actions");
  actions.parentNode.insertBefore(box, actions);
  const next=$("#nextBtn");
  next.disabled=true;
  sel.addEventListener("change", e=>{
    const val=Number(e.target.value);
    const msg=document.createElement("p");
    msg.className="reflectionFeedback";
    if(val>=4) msg.textContent="Deine hohe Sicherheit war hier gerechtfertigt. Merke dir, welche Strategie funktioniert hat.";
    else if(val<=2) msg.textContent="Du warst unsicher, aber deine Lösung war korrekt. Die genutzte Prüfstrategie kann dir künftig Sicherheit geben.";
    else msg.textContent="Mittlere Sicherheit passt gut zu Prüfaufgaben: Entscheidend ist, welche Strategie du bewusst genutzt hast.";
    const oldMsg=box.querySelector(".reflectionFeedback");
    if(oldMsg) oldMsg.remove();
    box.appendChild(msg);
    ensureStats();
    const t=currentTask(), st=currentStage();
    state.stats.confidence.push({stageId:st.id,taskId:t.id,taskType:t.type,value:val,correct:true,ts:Date.now()});
    const lastHist=[...(state.stats.history||[])].reverse().find(x=>x.taskId===t.id);
    if(lastHist) lastHist.confidence=val;
    state.stats.byStage[st.id] ||= {title:st.title,wrong:0,solved:0,fallback:0,confidence:[]};
    state.stats.byType[t.type] ||= {wrong:0,solved:0,fallback:0,confidence:[]};
    state.stats.byStage[st.id].confidence.push(val);
    state.stats.byType[t.type].confidence.push(val);
    save();
    renderLearningAnalysis();
    ProgressTracker?.sendProgress({stageId:st.id,taskId:t.id,taskType:t.type,confidence:val,reflection:true,solvedCorrect:true});
    next.disabled=false;
  });
}
function check(){const t=currentTask();let ok=false;if(state.fallbackMode){const checked=document.querySelector("input[name='fallbackChoice']:checked");ok=checked&&Number(checked.value)===t.fallbackAnswer;if(ok){const fb=$("#feedback");fb.textContent="✓ Richtig. "+(t.feedback||"");fb.className="feedback ok";markSolved()}else{const fb=$("#feedback");fb.textContent="Noch nicht. Die richtige Antwort muss wirklich die andere Perspektive ergänzen, nicht nur die eigene Sicht wiederholen.";fb.className="feedback no";recordAttemptResult(false,t,true)}return}
if(t.type==="choice"||t.type==="promptChoice"){const c=document.querySelector("input[name='choice']:checked");ok=c&&Number(c.value)===t.answer}
if(t.type==="cloze"){const v=norm($("#clozeInput").value);ok=(t.accepted||[]).some(a=>norm(a)===v)}
if(t.type==="match")ok=[...document.querySelectorAll(".matchRow select")].every(sel=>sel.value===sel.dataset.answer);
let rewriteReason="";
if(t.type==="rewrite"||t.type==="promptRewrite"){const el=$("#rewriteInput");const res=validateRewrite(t,el?el.value:"");ok=res.ok;rewriteReason=res.reason}
if(t.type==="sort")ok=JSON.stringify(state.selectedSort)===JSON.stringify(t.answer);
if(t.type==="livePaste"){const pasted=($("#pasteInput")?.value||"").trim();const c=document.querySelector("input[name='liveChoice']:checked");ok=pasted.length>=(t.minPasteLength||60)&&c&&Number(c.value)===t.answer;if(pasted.length<(t.minPasteLength||60))rewriteReason="Füge zuerst eine echte oder ausreichend lange Beispielantwort ein."}
const fb=$("#feedback");if(ok){fb.textContent="✓ Richtig. "+(t.feedback||"");fb.className="feedback ok";markSolved()}else{recordValidationReason(rewriteReason);const attempts=increaseAttempt(t);recordAttemptResult(false,t,false);if((t.type==="cloze"||t.type==="rewrite"||t.type==="promptRewrite")&&t.fallbackChoices&&attempts>=(t.maxAttempts||2)){showFallbackChoices(t);recordAttemptResult(false,t,true);return}fb.textContent=rewriteReason||"Noch nicht ganz. Versuche es noch einmal. Danach erhältst du drei Antwortmöglichkeiten.";fb.className="feedback no"}}
function markSolved(){const st=currentStage(),t=currentTask();if(!state.solved[t.id]){recordAttemptResult(true,t,state.fallbackMode);state.solved[t.id]=true;state.score++;state.attempts[t.id]=0;const solvedInStage=st.tasks.filter(x=>state.solved[x.id]).length;if(solvedInStage>=st.unlockScore&&!state.badges.includes(st.badge)){state.badges.push(st.badge);$("#feedback").textContent+=` Neues Abzeichen: ${st.badge}`}ProgressTracker?.sendProgress({stageId:st.id,stageTitle:st.title,taskId:t.id,taskType:t.type,score:state.score,badges:state.badges,solvedCount:Object.keys(state.solved).length,usedFallback:state.fallbackMode})}$("#checkBtn").disabled=true;renderProgress();renderReflection();save()}
function next(){const st=currentStage();if(state.taskIndex<st.tasks.length-1)state.taskIndex++;else if(state.stageIndex<state.data.stages.length-1){state.stageIndex++;state.taskIndex=0}else{$("#feedback").textContent="Alle Etappen geschafft.";$("#feedback").className="feedback ok";return}render()}
function renderProgress(){const all=state.data.stages.flatMap(s=>s.tasks),solved=Object.keys(state.solved).length,percent=all.length?Math.round(solved/all.length*100):0;$("#trackFill").style.width=`${percent}%`;$("#walker").style.left=`${percent}%`;$("#progressText").textContent=`${solved} von ${all.length} Aufgaben gelöst (${percent}%).`;$("#badgeList").innerHTML=state.badges.length?state.badges.map(b=>`<span class="badge">${b}</span>`).join(""):"<span>Noch kein Abzeichen.</span>";$("#stageDots").innerHTML=state.data.stages.map((s,i)=>{const done=state.badges.includes(s.badge);return `<span class="${done?"done":""}">${done?"●":"○"} ${i+1}</span>`}).join("");renderLearningAnalysis()}
function renderQr(text){const c=$("#qrCanvas"),ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);const size=8;let seed=0;for(let ch of text)seed=(seed+ch.charCodeAt(0)*17)%9973;ctx.fillStyle="#111827";for(let y=0;y<17;y++)for(let x=0;x<17;x++){const on=(x<4&&y<4)||(x>12&&y<4)||(x<4&&y>12)||((x*y+seed+x+y*3)%5===0);if(on)ctx.fillRect(14+x*size,14+y*size,size-1,size-1)}}
$("#checkBtn").addEventListener("click",check);$("#nextBtn").addEventListener("click",next);$("#menuBtn").addEventListener("click",()=>$("#drawer").classList.add("open"));$("#closeMenu").addEventListener("click",()=>$("#drawer").classList.remove("open"));$("#openQrTarget").addEventListener("click",()=>{
 const url=state.data?.meta?.qrTarget;
 if(url) window.open(url,"_blank"); else alert("Kein QR-Ziel hinterlegt.");
});$("#resetBtn").addEventListener("click",()=>{localStorage.removeItem("pwTrainerState");location.reload()});document.getElementById("exportJsonBtn")?.addEventListener("click",()=>exportData("json"));
document.getElementById("exportCsvBtn")?.addEventListener("click",()=>exportData("csv"));
init();
