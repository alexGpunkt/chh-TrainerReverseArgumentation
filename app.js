const state={data:null,stageIndex:0,taskIndex:0,score:0,solved:{},badges:[],selectedSort:[],attempts:{},fallbackMode:false};
const $=s=>document.querySelector(s);const taskArea=$("#taskArea");
function save(){localStorage.setItem("pwTrainerState",JSON.stringify({stageIndex:state.stageIndex,taskIndex:state.taskIndex,score:state.score,solved:state.solved,badges:state.badges,attempts:state.attempts}))}
function loadSaved(){try{Object.assign(state,JSON.parse(localStorage.getItem("pwTrainerState")||"{}"))}catch(e){}}
function norm(s){return String(s||"").toLowerCase().trim().replaceAll("ä","ae").replaceAll("ö","oe").replaceAll("ü","ue").replaceAll("ß","ss")}
async function init(){const r=await fetch("tasks.json");state.data=await r.json();loadSaved();renderQr(state.data.meta.qrTarget);render()}
function currentStage(){return state.data.stages[state.stageIndex]}function currentTask(){return currentStage().tasks[state.taskIndex]}
function render(){const st=currentStage(),t=currentTask();state.fallbackMode=false;$("#stageTitle").textContent=st.title;$("#prompt").textContent=t.prompt;$("#claim").textContent=t.claim||"";$("#claim").style.display=t.claim?"block":"none";$("#taskType").textContent=typeLabel(t.type);$("#taskCount").textContent=`${state.taskIndex+1}/${st.tasks.length}`;$("#scorePill").textContent=`${state.score} ✓`;$("#feedback").textContent="";$("#feedback").className="feedback";$("#nextBtn").disabled=true;$("#checkBtn").disabled=false;$("#taskHint").textContent=st.hint;state.selectedSort=[];renderProgress();renderTask(t);save()}
function typeLabel(t){return{choice:"Auswahl",cloze:"Lücke",match:"Zuordnung",rewrite:"Umformulieren",sort:"Reihenfolge"}[t]||"Aufgabe"}
function renderTask(t){taskArea.innerHTML="";if(t.type==="choice")renderChoice(t.options,"choice");if(t.type==="cloze"){const p=document.createElement("p");p.innerHTML=t.text.replace("___","<strong>_____</strong>");const input=document.createElement("input");input.type="text";input.placeholder="Antwort eingeben";input.id="clozeInput";taskArea.append(p,input)}if(t.type==="match"){t.pairs.forEach(pair=>{const row=document.createElement("div");row.className="matchRow";const shuffled=[...t.pairs.map(p=>p[1])].sort(()=>Math.random()-.5);row.innerHTML=`<strong>${pair[0]}</strong>`;const sel=document.createElement("select");sel.dataset.answer=pair[1];sel.innerHTML=`<option value="">Passende Frage wählen…</option>`+shuffled.map(x=>`<option>${x}</option>`).join("");row.appendChild(sel);taskArea.appendChild(row)})}if(t.type==="rewrite"){const info=document.createElement("p");info.textContent="Tipp: Formuliere vorsichtig, aber nicht beliebig. Der Sinn soll erhalten bleiben.";const ta=document.createElement("textarea");ta.id="rewriteInput";ta.placeholder="Deine umformulierte Version…";taskArea.append(info,ta)}if(t.type==="sort"){const box=document.createElement("div");[...t.items].sort(()=>Math.random()-.5).forEach(item=>{const div=document.createElement("button");div.type="button";div.className="sortItem";div.textContent=item;div.onclick=()=>{if(state.selectedSort.includes(item))return;state.selectedSort.push(item);div.classList.add("active");div.textContent=`${state.selectedSort.length}. ${item}`};box.appendChild(div)});taskArea.appendChild(box)}}
function renderChoice(options,name="choice"){options.forEach((opt,i)=>{const label=document.createElement("label");label.className="option";label.innerHTML=`<input type="radio" name="${name}" value="${i}"><span>${opt}</span>`;taskArea.appendChild(label)})}
function showFallbackChoices(t){state.fallbackMode=true;taskArea.innerHTML="";const intro=document.createElement("p");intro.className="supportIntro";intro.textContent=t.fallbackIntro||"Wähle nun aus drei möglichen Antworten die passendste aus.";taskArea.appendChild(intro);renderChoice(t.fallbackChoices,"fallbackChoice");const fb=$("#feedback");fb.textContent="Hilfestufe: Alle Antworten klingen möglich, aber nur eine erfüllt die Aufgabe wirklich.";fb.className="feedback"}
function increaseAttempt(t){state.attempts[t.id]=(state.attempts[t.id]||0)+1;save();return state.attempts[t.id]}
function check(){const t=currentTask();let ok=false;if(state.fallbackMode){const checked=document.querySelector("input[name='fallbackChoice']:checked");ok=checked&&Number(checked.value)===t.fallbackAnswer;if(ok){const fb=$("#feedback");fb.textContent="✓ Richtig. "+(t.feedback||"");fb.className="feedback ok";markSolved()}else{const fb=$("#feedback");fb.textContent="Noch nicht. Die richtige Antwort muss wirklich die andere Perspektive ergänzen, nicht nur die eigene Sicht wiederholen.";fb.className="feedback no"}return}
if(t.type==="choice"){const c=document.querySelector("input[name='choice']:checked");ok=c&&Number(c.value)===t.answer}
if(t.type==="cloze"){const v=norm($("#clozeInput").value);ok=(t.accepted||[]).some(a=>norm(a)===v)}
if(t.type==="match")ok=[...document.querySelectorAll(".matchRow select")].every(sel=>sel.value===sel.dataset.answer);
if(t.type==="rewrite"){const v=norm($("#rewriteInput").value);ok=v.length>=25&&t.mustContainAny.some(w=>v.includes(norm(w)))}
if(t.type==="sort")ok=JSON.stringify(state.selectedSort)===JSON.stringify(t.answer);const state= {

    data:null,
    stageIndex:0,
    taskIndex:0,
    score:0,
    solved: {}

    ,
    badges:[],
    selectedSort:[],
    attempts: {}

    ,
    fallbackMode:false
}

;
const $=s=>document.querySelector(s);
const taskArea=$("#taskArea");

function save() {
    localStorage.setItem("pwTrainerState", JSON.stringify({
            stageIndex:state.stageIndex, taskIndex:state.taskIndex, score:state.score, solved:state.solved, badges:state.badges, attempts:state.attempts
        }))
}

function loadSaved() {
    try {
        Object.assign(state, JSON.parse(localStorage.getItem("pwTrainerState")||"{}"))
    }

    catch(e) {}
}

function norm(s) {
    return String(s||"").toLowerCase().trim().replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss")
}

async function init() {
    const r=await fetch("tasks.json");
    state.data=await r.json();
    loadSaved();
    renderQr(state.data.meta.qrTarget);
    render()
}

function currentStage() {
    return state.data.stages[state.stageIndex]
}

function currentTask() {
    return currentStage().tasks[state.taskIndex]
}

function render() {
    const st=currentStage(),
    t=currentTask();
    state.fallbackMode=false;
    $("#stageTitle").textContent=st.title;
    $("#prompt").textContent=t.prompt;
    $("#claim").textContent=t.claim||"";
    $("#claim").style.display=t.claim?"block": "none";
    $("#taskType").textContent=typeLabel(t.type);

    $("#taskCount").textContent=`$ {
        state.taskIndex+1
    }

    /$ {
        st.tasks.length
    }

    `;

    $("#scorePill").textContent=`$ {
        state.score
    }

    ✓`;
    $("#feedback").textContent="";
    $("#feedback").className="feedback";
    $("#nextBtn").disabled=true;
    $("#checkBtn").disabled=false;
    $("#taskHint").textContent=st.hint;
    state.selectedSort=[];
    renderProgress();
    renderTask(t);
    save()
}

function typeLabel(t) {
    return {
        choice: "Auswahl", cloze:"Lücke", match:"Zuordnung", rewrite:"Umformulieren", sort:"Reihenfolge"
    }

    [t]||"Aufgabe"
}

function renderTask(t) {
    taskArea.innerHTML="";
    if(t.type==="choice")renderChoice(t.options, "choice");

    if(t.type==="cloze") {
        const p=document.createElement("p");
        p.innerHTML=t.text.replace("___", "<strong>_____</strong>");
        const input=document.createElement("input");
        input.type="text";
        input.placeholder="Antwort eingeben";
        input.id="clozeInput";
        taskArea.append(p, input)
    }

    if(t.type==="match") {
        t.pairs.forEach(pair=> {
                const row=document.createElement("div"); row.className="matchRow"; const shuffled=[...t.pairs.map(p=>p[1])].sort(()=>Math.random()-.5); row.innerHTML=`<strong>$ {
                    pair[0]
                }

                </strong>`; const sel=document.createElement("select"); sel.dataset.answer=pair[1]; sel.innerHTML=`<option value="" >Passende Frage wählen…</option>`+shuffled.map(x=>`<option>$ {
                        x
                    }

                    </option>`).join(""); row.appendChild(sel); taskArea.appendChild(row)
            })
    }

    if(t.type==="rewrite") {
        const info=document.createElement("p");
        info.textContent="Tipp: Formuliere vorsichtig, aber nicht beliebig. Der Sinn soll erhalten bleiben.";
        const ta=document.createElement("textarea");
        ta.id="rewriteInput";
        ta.placeholder="Deine umformulierte Version…";
        taskArea.append(info, ta)
    }

    if(t.type==="sort") {
        const box=document.createElement("div");

        [...t.items].sort(()=>Math.random()-.5).forEach(item=> {
                const div=document.createElement("button"); div.type="button"; div.className="sortItem"; div.textContent=item; div.onclick=()=> {
                    if(state.selectedSort.includes(item))return; state.selectedSort.push(item); div.classList.add("active"); div.textContent=`$ {
                        state.selectedSort.length
                    }

                    . $ {
                        item
                    }

                    `
                }

                ; box.appendChild(div)
            });
        taskArea.appendChild(box)
    }
}

function renderChoice(options, name="choice") {
    options.forEach((opt, i)=> {
            const label=document.createElement("label"); label.className="option"; label.innerHTML=`<input type="radio" name="${name}" value="${i}" ><span>$ {
                opt
            }

            </span>`; taskArea.appendChild(label)
        })
}

function showFallbackChoices(t) {
    state.fallbackMode=true;
    taskArea.innerHTML="";
    const intro=document.createElement("p");
    intro.className="supportIntro";
    intro.textContent=t.fallbackIntro||"Wähle nun aus drei möglichen Antworten die passendste aus.";
    taskArea.appendChild(intro);
    renderChoice(t.fallbackChoices, "fallbackChoice");
    const fb=$("#feedback");
    fb.textContent="Hilfestufe: Alle Antworten klingen möglich, aber nur eine erfüllt die Aufgabe wirklich.";
    fb.className="feedback"
}

function increaseAttempt(t) {
    state.attempts[t.id]=(state.attempts[t.id]||0)+1;
    save();
    return state.attempts[t.id]
}

function check() {
    const t=currentTask();
    let ok=false;

    if(state.fallbackMode) {
        const checked=document.querySelector("input[name='fallbackChoice']:checked");
        ok=checked&&Number(checked.value)===t.fallbackAnswer;

        if(ok) {
            const fb=$("#feedback");
            fb.textContent="✓ Richtig. "+(t.feedback||"");
            fb.className="feedback ok";
            markSolved()
        }

        else {
            const fb=$("#feedback");
            fb.textContent="Noch nicht. Die richtige Antwort muss wirklich die andere Perspektive ergänzen, nicht nur die eigene Sicht wiederholen.";
            fb.className="feedback no"
        }

        return
    }

    if(t.type==="choice") {
        const c=document.querySelector("input[name='choice']:checked");
        ok=c&&Number(c.value)===t.answer
    }

    if(t.type==="cloze") {
        const v=norm($("#clozeInput").value);
        ok=(t.accepted||[]).some(a=>norm(a)===v)
    }

    if(t.type==="match")ok=[...document.querySelectorAll(".matchRow select")].every(sel=>sel.value===sel.dataset.answer);

    if(t.type==="rewrite") {
        const v=norm($("#rewriteInput").value);
        ok=v.length>=25&&t.mustContainAny.some(w=>v.includes(norm(w)))
    }

    if(t.type==="sort")ok=JSON.stringify(state.selectedSort)===JSON.stringify(t.answer);
    const fb=$("#feedback");

    if(ok) {
        fb.textContent="✓ Richtig. "+(t.feedback||"");
        fb.className="feedback ok";
        markSolved()
    }

    else {
        const attempts=increaseAttempt(t);

        if((t.type==="cloze" ||t.type==="rewrite")&&t.fallbackChoices&&attempts>=(t.maxAttempts||2)) {
            showFallbackChoices(t);
            return
        }

        fb.textContent="Noch nicht ganz. Versuche es noch einmal. Danach erhältst du drei Antwortmöglichkeiten.";
        fb.className="feedback no"
    }
}

function markSolved() {
    const st=currentStage(),
    t=currentTask();

    if( !state.solved[t.id]) {
        state.solved[t.id]=true;
        state.score++;
        state.attempts[t.id]=0;
        const solvedInStage=st.tasks.filter(x=>state.solved[x.id]).length;

        if(solvedInStage>=st.unlockScore&& !state.badges.includes(st.badge)) {
            state.badges.push(st.badge);

            $("#feedback").textContent+=` Neues Abzeichen: $ {
                st.badge
            }

            `
        }

        ProgressTracker?.sendProgress({
            stageId:st.id, stageTitle:st.title, taskId:t.id, taskType:t.type, score:state.score, badges:state.badges, solvedCount:Object.keys(state.solved).length, usedFallback:state.fallbackMode
        })
}

$("#nextBtn").disabled=false;
$("#checkBtn").disabled=true;
renderProgress();
save()
}

function next() {
    const st=currentStage();
    if(state.taskIndex<st.tasks.length-1)state.taskIndex++;

    else if(state.stageIndex<state.data.stages.length-1) {
        state.stageIndex++;
        state.taskIndex=0
    }

    else {
        $("#feedback").textContent="Alle Etappen geschafft.";
        $("#feedback").className="feedback ok";
        return
    }

    render()
}

function renderProgress() {
    const all=state.data.stages.flatMap(s=>s.tasks),
    solved=Object.keys(state.solved).length,
    percent=all.length?Math.round(solved/all.length*100): 0;

    $("#trackFill").style.width=`$ {
        percent
    }

    %`;

    $("#walker").style.left=`$ {
        percent
    }

    %`;

    $("#progressText").textContent=`$ {
        solved
    }

    von $ {
        all.length
    }

    Aufgaben gelöst ($ {
            percent
        }

        %).`;

    $("#badgeList").innerHTML=state.badges.length?state.badges.map(b=>`<span class="badge" >$ {
            b
        }

        </span>`).join(""):"<span>Noch kein Abzeichen.</span>";

    $("#stageDots").innerHTML=state.data.stages.map((s, i)=> {
            const done=state.badges.includes(s.badge); return `<span class="${done?" done":" "}" >$ {
                done?"●":"○"
            }

            $ {
                i+1
            }

            </span>`
        }).join("")
}

function renderQr(text) {
    const c=$("#qrCanvas"),
    ctx=c.getContext("2d");
    ctx.fillStyle="#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    const size=8;
    let seed=0;
    for(let ch of text)seed=(seed+ch.charCodeAt(0)*17)%9973;
    ctx.fillStyle="#111827";

    for(let y=0; y<17; y++)for(let x=0; x<17; x++) {
        const on=(x<4&&y<4)||(x>12&&y<4)||(x<4&&y>12)||((x*y+seed+x+y*3)%5===0);
        if(on)ctx.fillRect(14+x*size, 14+y*size, size-1, size-1)
    }
}

$("#checkBtn").addEventListener("click", check);
$("#nextBtn").addEventListener("click", next);
$("#menuBtn").addEventListener("click", ()=>$("#drawer").classList.add("open"));
$("#closeMenu").addEventListener("click", ()=>$("#drawer").classList.remove("open"));
$("#openQrTarget").addEventListener("click", ()=>window.open(state.data.meta.qrTarget, "_blank"));

$("#resetBtn").addEventListener("click", ()=> {
        localStorage.removeItem("pwTrainerState"); location.reload()
    });
init();
const fb=$("#feedback");if(ok){fb.textContent="✓ Richtig. "+(t.feedback||"");fb.className="feedback ok";markSolved()}else{const attempts=increaseAttempt(t);if((t.type==="cloze"||t.type==="rewrite")&&t.fallbackChoices&&attempts>=(t.maxAttempts||2)){showFallbackChoices(t);return}fb.textContent="Noch nicht ganz. Versuche es noch einmal. Danach erhältst du drei Antwortmöglichkeiten.";fb.className="feedback no"}}
function markSolved(){const st=currentStage(),t=currentTask();if(!state.solved[t.id]){state.solved[t.id]=true;state.score++;state.attempts[t.id]=0;const solvedInStage=st.tasks.filter(x=>state.solved[x.id]).length;if(solvedInStage>=st.unlockScore&&!state.badges.includes(st.badge)){state.badges.push(st.badge);$("#feedback").textContent+=` Neues Abzeichen: ${st.badge}`}ProgressTracker?.sendProgress({stageId:st.id,stageTitle:st.title,taskId:t.id,taskType:t.type,score:state.score,badges:state.badges,solvedCount:Object.keys(state.solved).length,usedFallback:state.fallbackMode})}$("#nextBtn").disabled=false;$("#checkBtn").disabled=true;renderProgress();save()}
function next(){const st=currentStage();if(state.taskIndex<st.tasks.length-1)state.taskIndex++;else if(state.stageIndex<state.data.stages.length-1){state.stageIndex++;state.taskIndex=0}else{$("#feedback").textContent="Alle Etappen geschafft.";$("#feedback").className="feedback ok";return}render()}
function renderProgress(){const all=state.data.stages.flatMap(s=>s.tasks),solved=Object.keys(state.solved).length,percent=all.length?Math.round(solved/all.length*100):0;$("#trackFill").style.width=`${percent}%`;$("#walker").style.left=`${percent}%`;$("#progressText").textContent=`${solved} von ${all.length} Aufgaben gelöst (${percent}%).`;$("#badgeList").innerHTML=state.badges.length?state.badges.map(b=>`<span class="badge">${b}</span>`).join(""):"<span>Noch kein Abzeichen.</span>";$("#stageDots").innerHTML=state.data.stages.map((s,i)=>{const done=state.badges.includes(s.badge);return `<span class="${done?"done":""}">${done?"●":"○"} ${i+1}</span>`}).join("")}
function renderQr(text){const c=$("#qrCanvas"),ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);const size=8;let seed=0;for(let ch of text)seed=(seed+ch.charCodeAt(0)*17)%9973;ctx.fillStyle="#111827";for(let y=0;y<17;y++)for(let x=0;x<17;x++){const on=(x<4&&y<4)||(x>12&&y<4)||(x<4&&y>12)||((x*y+seed+x+y*3)%5===0);if(on)ctx.fillRect(14+x*size,14+y*size,size-1,size-1)}}
$("#checkBtn").addEventListener("click",check);$("#nextBtn").addEventListener("click",next);$("#menuBtn").addEventListener("click",()=>$("#drawer").classList.add("open"));$("#closeMenu").addEventListener("click",()=>$("#drawer").classList.remove("open"));$("#openQrTarget").addEventListener("click",()=>window.open(state.data.meta.qrTarget,"_blank"));$("#resetBtn").addEventListener("click",()=>{localStorage.removeItem("pwTrainerState");location.reload()});init();
