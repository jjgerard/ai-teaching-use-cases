// Statement types and per-point classification (see policy/STATEMENT-TYPES-BRIEF.md and policy/CLAIMS-BRIEF.md).
//   node policy/claims.js types <types.json>                    validate a statement-type vocabulary
//   node policy/claims.js validate <types.json> <dir...>        validate classification files against a vocabulary and data/policy/points.json
//   node policy/claims.js merge <types.json> <dir...> [--out f]  validate, then write data/policy/claims.json
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.join(__dirname, "..", "data", "policy");
const GROUPS = ["use_rules", "disclosure_and_evidence", "referencing", "data_and_privacy", "tools", "assessment_design", "integrity_and_consequences", "accuracy_and_responsibility", "support_and_training", "staff_and_governance", "ethics_and_equity", "other"];
const FIT = ["clear", "partial", "none"];
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
function checkTypes(file, { root = ROOT } = {}) {
  const errs = []; const j = JSON.parse(fs.readFileSync(file, "utf8")); const e = (m) => errs.push(m); const ids = new Set();
  const pts = new Set(JSON.parse(fs.readFileSync(path.join(root, "points.json"), "utf8")).map((p) => p.doc_id + ":" + p.point_id));
  if (!Array.isArray(j.types) || !j.types.length) { e("no types"); return { errs, ids }; }
  for (const t of j.types) {
    const k = t.id || "?"; const te = (m) => e(`${k}: ${m}`);
    if (!/^[a-z][a-z0-9_]*$/.test(t.id || "")) te("id must be snake_case"); else if (ids.has(t.id)) te("duplicate id"); ids.add(t.id);
    if (t.id === "unclassified") te("'unclassified' is reserved");
    if (!t.label || words(t.label) > 8) te("label is required and at most 8 words");
    if (!GROUPS.includes(t.group)) te(`group ${JSON.stringify(t.group)} is not in the list`);
    if (!t.definition) te("definition is required"); if (!t.decision_rule) te("decision_rule is required");
    if (!Array.isArray(t.examples) || t.examples.length < 3) te("at least 3 examples (refs) are required");
    else { for (const r of t.examples) if (!pts.has(r)) te(`example ${r} is not a point in points.json`); const inst = new Set(t.examples.map((r) => r.split(":")[0])); if (inst.size < 3) te("examples must come from at least 3 institutions"); }
  }
  return { errs, ids };
}
function checkClass(typesFile, dirs, { root = ROOT } = {}) {
  const { errs, ids } = checkTypes(typesFile, { root }); const rows = [];
  const pts = new Map(JSON.parse(fs.readFileSync(path.join(root, "points.json"), "utf8")).map((p) => [p.doc_id + ":" + p.point_id, p]));
  const seen = new Set();
  const files = dirs.flatMap((d) => (fs.statSync(d).isDirectory() ? fs.readdirSync(d).filter((f) => f.endsWith(".json")).map((f) => path.join(d, f)) : [d]));
  for (const f of files) {
    let j; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch { errs.push(`${f}: not valid JSON`); continue; }
    if (!j.coder) errs.push(`${f}: coder is required`);
    for (const r of j.rows || []) {
      const e = (m) => errs.push(`${r.ref || "?"}: ${m}`);
      if (!pts.has(r.ref)) { e("ref is not a point in points.json"); continue; } if (seen.has(r.ref)) e("classified twice"); seen.add(r.ref);
      const ok = (v) => v === "unclassified" || ids.has(v);
      if (!ok(r.claim)) e(`claim ${JSON.stringify(r.claim)} is not in the vocabulary`);
      if (r.claim2 != null && (!ids.has(r.claim2) || r.claim2 === r.claim)) e("claim2 must be a different vocabulary type or null");
      if (!FIT.includes(r.fit)) e(`fit ${JSON.stringify(r.fit)} must be ${FIT.join("|")}`);
      if (r.claim === "unclassified" && r.fit !== "none") e("unclassified requires fit none"); if (r.fit === "none" && r.claim !== "unclassified") e("fit none requires claim unclassified");
      if (r.suggest != null && words(r.suggest) > 12) e("suggest is at most 12 words"); if (r.fit === "clear" && r.suggest) e("suggest only when fit is partial or none");
      rows.push({ ref: r.ref, doc_id: pts.get(r.ref).doc_id, point_id: pts.get(r.ref).point_id, claim: r.claim, claim2: r.claim2 ?? null, fit: r.fit, suggest: r.suggest ?? null, coder: j.coder });
    }
  }
  return { errs, rows };
}
module.exports = { checkTypes, checkClass, GROUPS, FIT };
if (require.main === module) {
  const [cmd, tf, ...rest] = process.argv.slice(2); const oi = rest.indexOf("--out"); const out = oi >= 0 ? rest.splice(oi, 2)[1] : path.join(ROOT, "claims.json");
  if (cmd === "types" && tf) { const r = checkTypes(tf); r.errs.forEach((m) => console.log("ERROR " + m)); console.log(`${r.ids.size} types, ${r.errs.length} errors`); process.exit(r.errs.length ? 1 : 0); }
  if ((cmd === "validate" || cmd === "merge") && tf && rest.length) { const r = checkClass(tf, rest); r.errs.forEach((m) => console.log("ERROR " + m)); console.log(`${r.rows.length} points classified, ${r.errs.length} errors`); if (cmd === "merge" && !r.errs.length) { fs.writeFileSync(out, JSON.stringify(r.rows, null, 1) + "\n"); console.log("wrote", out); } process.exit(r.errs.length ? 1 : 0); }
  console.error("usage: node policy/claims.js types <types.json> | validate|merge <types.json> <dir...> [--out file]"); process.exit(2);
}
