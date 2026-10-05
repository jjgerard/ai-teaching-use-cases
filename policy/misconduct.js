// Academic misconduct audit: validate and merge per-document files (see policy/MISCONDUCT-BRIEF.md).
//   node policy/misconduct.js validate <dir...>
//   node policy/misconduct.js merge <dir...> [--out file]     writes data/policy/misconduct.json
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.join(__dirname, "..", "data", "policy");
const norm = (s) => String(s).toLowerCase().replace(/[‘’“”'"`\-‐-―\s]+/g, " ").trim();
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
function validateFile(file, { root = ROOT, schemaFile } = {}) {
  const errs = []; let j; try { j = JSON.parse(fs.readFileSync(file, "utf8")); } catch { return { errs: [`${file}: not valid JSON`], doc: null }; }
  const id = j.doc_id; const e = (m) => errs.push(`${id || file}: ${m}`); if (!id) { e("no doc_id"); return { errs, doc: null }; }
  const S = JSON.parse(fs.readFileSync(schemaFile || path.join(root, "misconduct-schema.json"), "utf8"));
  const sf = path.join(root, "snapshots", id + ".txt"); const snap = fs.existsSync(sf) ? norm(fs.readFileSync(sf, "utf8")) : null; if (snap === null) e("no snapshot");
  const q = (w, quote) => { if (!quote) return e(`${w}: quote is required`); if (words(quote) > 60) e(`${w}: quote over 60 words`); if (/\.\.\.|…|\[\s*…\s*\]/.test(quote)) e(`${w}: quote must not stitch passages`); else if (snap !== null && !snap.includes(norm(quote))) e(`${w}: quote is not in the snapshot`); };
  if (!j.coder) e("coder is required"); if (!S.scope[j.scope]) e("scope must be one of " + Object.keys(S.scope).join("|"));
  const list = (field, allowed, extra) => { const seen = new Set(); if (j[field] != null && !Array.isArray(j[field])) return e(`${field} must be a list`); for (const x of j[field] || []) { const k = x.value ?? x.method ?? x.term; if (!allowed.includes(k)) e(`${field}: ${JSON.stringify(k)} not in the vocabulary`); const key = k + "/" + (x.stance || ""); if (seen.has(key)) e(`${field}: ${key} listed twice`); seen.add(key); if (typeof x.ai_named !== "boolean") e(`${field} ${k}: ai_named must be true or false`); if (extra) extra(x, `${field} ${k}`); q(`${field} ${k}`, x.quote); } };
  list("offences", Object.keys(S.offences)); list("outcomes", Object.keys(S.outcomes)); list("process", Object.keys(S.process)); list("liability", Object.keys(S.liability));
  list("detection", Object.keys(S.detection.methods), (x, w) => { if (!S.detection.stances[x.stance]) e(`${w}: stance not in the vocabulary`); });
  if (j.definitions != null) { if (!Array.isArray(j.definitions)) e("definitions must be a list"); else for (const x of j.definitions) { if (!x.term || words(x.term) > 4) e("definition term is required, at most 4 words"); if (typeof x.ai_named !== "boolean") e("definition ai_named must be true or false"); q("definition " + x.term, x.quote); } }
  return { errs, doc: errs.length ? null : j };
}
function run(dirs, opts) { const all = { errs: [], docs: [] }; const files = dirs.flatMap((d) => (fs.statSync(d).isDirectory() ? fs.readdirSync(d).filter((f) => f.endsWith(".json") && !f.endsWith("-input.json")).map((f) => path.join(d, f)) : [d])); for (const f of files) { const r = validateFile(f, opts); all.errs.push(...r.errs); if (r.doc) all.docs.push(r.doc); } all.n = files.length; return all; }
module.exports = { validateFile, run };
if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2); const oi = rest.indexOf("--out"); const out = oi >= 0 ? rest.splice(oi, 2)[1] : path.join(ROOT, "misconduct.json");
  if (!["validate", "merge"].includes(cmd) || !rest.length) { console.error("usage: node policy/misconduct.js validate|merge <dir...> [--out file]"); process.exit(2); }
  const r = run(rest); r.errs.forEach((m) => console.log("ERROR " + m)); const n = (f) => r.docs.reduce((s, d) => s + (d[f] || []).length, 0); console.log(`${r.n} documents, ${n("offences")} offences, ${n("detection")} detection, ${n("process")} process, ${n("outcomes")} outcomes, ${r.errs.length} errors`);
  if (cmd === "merge" && !r.errs.length) { fs.writeFileSync(out, JSON.stringify(r.docs, null, 1) + "\n"); console.log("wrote", out); }
  process.exit(r.errs.length ? 1 : 0);
}
