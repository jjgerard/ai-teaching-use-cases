// Support and training forms audit: validate and merge per-document files (see policy/SUPPORT-BRIEF.md).
//   node policy/support.js validate <dir...>
//   node policy/support.js merge <dir...> [--out file]     writes data/policy/support.json
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.join(__dirname, "..", "data", "policy");
const norm = (s) => String(s).toLowerCase().replace(/[‘’“”'"`\-‐-―\s]+/g, " ").trim();
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
function validateFile(file, { root = ROOT, formsFile } = {}) {
  const errs = [], rows = []; let j; try { j = JSON.parse(fs.readFileSync(file, "utf8")); } catch { return { errs: [`${file}: not valid JSON`], rows }; }
  const id = j.doc_id; const e = (m) => errs.push(`${id || file}: ${m}`); if (!id) { e("no doc_id"); return { errs, rows }; }
  const V = JSON.parse(fs.readFileSync(formsFile || path.join(root, "support-forms.json"), "utf8")); const forms = new Set(V.forms.map((f) => f.id)), reqs = new Set(Object.keys(V.requirement)), auds = new Set(Object.keys(V.audience));
  const sf = path.join(root, "snapshots", id + ".txt"); const snap = fs.existsSync(sf) ? norm(fs.readFileSync(sf, "utf8")) : null; if (snap === null) e("no snapshot");
  if (!j.coder) e("coder is required"); if (!Array.isArray(j.found)) e("found must be a list (empty if the document offers none)");
  const seen = new Set();
  for (const f of j.found || []) {
    const k = f.form || "?"; const fe = (m) => e(`${k}: ${m}`);
    if (!forms.has(f.form)) fe("form is not in the vocabulary"); else if (seen.has(f.form)) fe("listed twice"); seen.add(f.form);
    if (!reqs.has(f.requirement)) fe("requirement must be one of " + [...reqs].join("|")); if (!auds.has(f.audience)) fe("audience must be one of " + [...auds].join("|"));
    if (!f.quote) fe("quote is required"); else { if (words(f.quote) > 60) fe("quote over 60 words"); if (/\.\.\.|…|\[\s*…\s*\]|\[\.\.\.\]/.test(f.quote)) fe("quote must not stitch passages"); if (snap !== null && !snap.includes(norm(f.quote))) fe("quote is not in the snapshot"); }
    if (f.name != null && words(f.name) > 12) fe("name is at most 12 words");
    rows.push({ doc_id: id, form: f.form, requirement: f.requirement, audience: f.audience, name: f.name ?? null, quote: f.quote, anchor: f.anchor ?? null, coder: j.coder });
  }
  return { errs, rows };
}
function run(dirs, opts) { const all = { errs: [], rows: [], docs: 0 }; const files = dirs.flatMap((d) => (fs.statSync(d).isDirectory() ? fs.readdirSync(d).filter((f) => f.endsWith(".json") && !f.endsWith("-input.json")).map((f) => path.join(d, f)) : [d])); for (const f of files) { const r = validateFile(f, opts); all.errs.push(...r.errs); all.rows.push(...r.rows); all.docs++; } return all; }
module.exports = { validateFile, run };
if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2); const oi = rest.indexOf("--out"); const out = oi >= 0 ? rest.splice(oi, 2)[1] : path.join(ROOT, "support.json");
  if (!["validate", "merge"].includes(cmd) || !rest.length) { console.error("usage: node policy/support.js validate|merge <dir...> [--out file]"); process.exit(2); }
  const r = run(rest); r.errs.forEach((m) => console.log("ERROR " + m)); console.log(`${r.docs} documents, ${r.rows.length} rows, ${r.errs.length} errors`);
  if (cmd === "merge" && !r.errs.length) { fs.writeFileSync(out, JSON.stringify(r.rows, null, 1) + "\n"); console.log("wrote", out); }
  process.exit(r.errs.length ? 1 : 0);
}
