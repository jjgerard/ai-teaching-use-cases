// Risks and responsibilities audit: validate and merge per-document files (see policy/RISKS-BRIEF.md).
//   node policy/risks.js validate <dir...>
//   node policy/risks.js merge <dir...> [--out file]     writes data/policy/risks.json
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.join(__dirname, "..", "data", "policy");
const norm = (s) => String(s).toLowerCase().replace(/[‘’“”'"`\-‐-―\s]+/g, " ").trim();
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
function validateFile(file, { root = ROOT, schemaFile } = {}) {
  const errs = []; let j; try { j = JSON.parse(fs.readFileSync(file, "utf8")); } catch { return { errs: [`${file}: not valid JSON`], doc: null }; }
  const id = j.doc_id; const e = (m) => errs.push(`${id || file}: ${m}`); if (!id) { e("no doc_id"); return { errs, doc: null }; }
  const S = JSON.parse(fs.readFileSync(schemaFile || path.join(root, "risks-schema.json"), "utf8"));
  const sf = path.join(root, "snapshots", id + ".txt"); const snap = fs.existsSync(sf) ? norm(fs.readFileSync(sf, "utf8")) : null; if (snap === null) e("no snapshot");
  const q = (w, quote) => { if (!quote) return e(`${w}: quote is required`); if (words(quote) > 60) e(`${w}: quote over 60 words`); if (/\.\.\.|…|\[\s*…\s*\]/.test(quote)) e(`${w}: quote must not stitch passages`); else if (snap !== null && !snap.includes(norm(quote))) e(`${w}: quote is not in the snapshot`); };
  if (!j.coder) e("coder is required");
  const list = (field, keyField, allowed, extra) => { const seen = new Set(); if (j[field] != null && !Array.isArray(j[field])) return e(`${field} must be a list`);
    for (const x of j[field] || []) { const k = x[keyField]; if (!allowed.includes(k)) e(`${field}: ${JSON.stringify(k)} not in the vocabulary`);
      let key = k; if (field === "risks") { if (!S.audience.includes(x.audience)) e(`${field} ${k}: audience must be one of ${S.audience.join("|")}`); key += "/" + x.audience; }
      else { if (!(x.bearer in S.bearers)) e(`${field} ${k}: bearer not in the vocabulary`); if (!(x.strength in S.strengths)) e(`${field} ${k}: strength not in the vocabulary`); key += "/" + x.bearer + "/" + x.strength; }
      if (seen.has(key)) e(`${field}: ${key} listed twice`); seen.add(key);
      if (typeof x.ai_named !== "boolean") e(`${field} ${k}: ai_named must be true or false`);
      q(`${field} ${k}`, x.quote); } };
  list("risks", "risk", Object.keys(S.risks));
  list("responsibilities", "duty", Object.keys(S.duties));
  return { errs, doc: errs.length ? null : j };
}
function run(dirs, opts) { const all = { errs: [], docs: [] }; const files = dirs.flatMap((d) => (fs.statSync(d).isDirectory() ? fs.readdirSync(d).filter((f) => f.endsWith(".json") && !f.endsWith("-input.json")).map((f) => path.join(d, f)) : [d])); for (const f of files) { const r = validateFile(f, opts); all.errs.push(...r.errs); if (r.doc) all.docs.push(r.doc); } all.n = files.length; return all; }
module.exports = { validateFile, run };
if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2); const oi = rest.indexOf("--out"); const out = oi >= 0 ? rest.splice(oi, 2)[1] : path.join(ROOT, "risks.json");
  if (!["validate", "merge"].includes(cmd) || !rest.length) { console.error("usage: node policy/risks.js validate|merge <dir...> [--out file]"); process.exit(2); }
  const r = run(rest); r.errs.forEach((m) => console.log("ERROR " + m)); const n = (f) => r.docs.reduce((s, d) => s + (d[f] || []).length, 0);
  console.log(`${r.n} documents, ${n("risks")} risk rows, ${n("responsibilities")} responsibility rows, ${r.errs.length} errors`);
  if (cmd === "merge" && !r.errs.length) { fs.writeFileSync(out, JSON.stringify(r.docs, null, 1) + "\n"); console.log("wrote", out); }
  process.exit(r.errs.length ? 1 : 0);
}
