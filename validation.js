/* Perspektivwechsel-Trainer 2.0 Phase 1
   Validierungslogik für freie Prompt-Antworten. */
function norm(s) {
  return String(s || "").toLowerCase().trim()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss");
}

function hasQuestionWord(v) {
  const words = ["welche", "welcher", "welches", "warum", "wann", "wie", "wo", "wodurch", "inwiefern", "unter welchen", "nenne", "prüfe", "pruefe", "kritisiere", "analysiere", "wechsle", "vergleiche", "bewerte"];
  return words.some(w => v.includes(w));
}

function hasQuestionStructure(raw) {
  const s = String(raw || "").trim().toLowerCase();
  return /\?$/.test(s) || /^(welche|welcher|welches|warum|wann|wie|wo|wodurch|inwiefern|unter welchen)\b/.test(s) || /^(nenne|prüfe|pruefe|analysiere|kritisiere|vergleiche|bewerte|untersuche|wechsle)\b/.test(s);
}

function hasAlternativeLanguage(v) {
  const words = ["alternative erklärungen", "alternative erklaerungen", "andere erklärungen", "andere erklaerungen", "andere gründe", "andere gruende", "andere hypothesen", "alternativen"];
  return words.some(w => v.includes(w));
}

function hasPromptAction(v) {
  const verbs = ["nenne", "prüfe", "pruefe", "analysiere", "kritisiere", "vergleiche", "bewerte", "untersuche", "wechsle", "formuliere", "zeige", "erkläre", "erklaere"];
  return verbs.some(w => v.includes(w));
}

function validateRewrite(t, value) {
  const v = norm(value);
  const min = t.minLength || 25;
  const hasKey = !t.mustContainAny || t.mustContainAny.some(w => v.includes(norm(w)));
  const hasNoBad = !t.mustNotContain || !t.mustNotContain.some(w => v.includes(norm(w)));
  const hasClaim = !t.mustContainClaimTermAny || t.mustContainClaimTermAny.some(w => v.includes(norm(w)));
  const hasQ = !t.mustContainQuestionWord || hasQuestionWord(v) || hasQuestionStructure(value);
  const hasAlt = !t.mustContainAlternativeExplanations || hasAlternativeLanguage(v);
  const actionOk = hasPromptAction(v) || hasQuestionStructure(value);
  const structureOk = !t.mustContainQuestionWord || hasQuestionStructure(value);
  return {
    ok: v.length >= min && hasKey && hasNoBad && hasClaim && hasQ && hasAlt && actionOk && structureOk,
    reason: !hasNoBad ? "Entferne suggestive Wörter wie „bestätige“, „beweise“ oder eindeutige Vorannahmen."
      : !hasClaim ? "Nenne die These oder den Kontext im Prompt ausdrücklich."
      : !structureOk ? "Der Prompt braucht eine erkennbare Frage- oder Aufforderungsstruktur, z. B. „Welche…?“, „Prüfe…“, „Analysiere…“."
      : !hasQ ? "Formuliere als echte Prüf- oder Fragehandlung: z. B. „Welche…?“, „Warum…?“, „Prüfe…“."
      : !hasAlt ? "Fordere ausdrücklich alternative Erklärungen oder andere Hypothesen ein."
      : !actionOk ? "Der Prompt braucht eine klare Handlung: prüfen, analysieren, kritisieren, vergleichen oder bewerten."
      : !hasKey ? "Fordere Gegenargumente, Bedingungen, Grenzen, Quellen, Rollenwechsel oder Alternativerklärungen ein."
      : v.length < min ? "Formuliere vollständiger: Ein guter Prompt enthält Kontext und Prüfauftrag." : ""
  };
}
