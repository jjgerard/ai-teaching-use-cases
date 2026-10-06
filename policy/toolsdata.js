// Tools and data audit: validate and merge per-document files (see policy/TOOLSDATA-BRIEF.md).
//   node policy/toolsdata.js validate <dir...>
//   node policy/toolsdata.js merge <dir...> [--out file]     writes data/policy/toolsdata.json
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.join(__dirname, "..", "data", "policy");
const norm = (s) => String(s).toLowerCase().replace(/[‘’“”'"`\-‐-―\s]+/g, " ").trim();
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
function validateFile(file, { root = ROOT, schemaFile } = {}) {
  const errs = []; let j; try { j = JSON.parse(fs.readFileSync(file, "utf8")); } catch { return { errs: [`${file}: not valid JSON`], doc: null }; }
  const id = j.doc_id; const e = (m) => errs.push(`${id || file}: ${m}`); if (!id) { e("no doc_id"); return { errs, doc: null }; }
  const S = JSON.parse(fs.readFileSync(schemaFile || path.join(root, "toolsdata-schema.json"), "utf8"));
  const sf = path.join(root, "snapshots", id + ".txt"); const snap = fs.existsSync(sf) ? norm(fs.readFileSync(sf, "utf8")) : null; if (snap === null) e("no snapshot");
  const q = (w, quote) => { if (!quote) return e(`${w}: quote is required`); if (words(quote) > 60) e(`${w}: quote over 60 words`); if (/\.\.\.|…|\[\s*…\s*\]/.test(quote)) e(`${w}: quote must not stitch passages`); else if (snap !== null && !snap.includes(norm(quote))) e(`${w}: quote is not in the snapshot`); };
  if (!j.coder) e("coder is required");
  const list = (field, keyField, allowed, stances, extra) => { const seen = new Set(); if (j[field] != null && !Array.isArray(j[field])) return e(`${field} must be a list`);
    for (const x of j[field] || []) { const k = x[keyField]; if (!allowed.includes(k)) e(`${field}: ${JSON.stringify(k)} not in the vocabulary`);
      if (stances) { if (!stances.includes(x.stance)) e(`${field} ${k}: stance not in the vocabulary`); }
      if (!S.audience.includes(x.audience)) e(`${field} ${k}: audience must be one of ${S.audience.join("|")}`);
      const key = k + "/" + (x.stance || "") + "/" + x.audience; if (seen.has(key)) e(`${field}: ${key} listed twice`); seen.add(key);
      if (typeof x.ai_named !== "boolean") e(`${field} ${k}: ai_named must be true or false`);
      if (x.conditions != null) { if (!Array.isArray(x.conditions)) e(`${field} ${k}: conditions must be a list`); else for (const c of x.conditions) if (!(c in S.conditions)) e(`${field} ${k}: condition ${JSON.stringify(c)} not in the vocabulary`); }
      if (stances && x.stance === "conditional" && !(x.conditions || []).length) e(`${field} ${k}: conditional needs at least one condition`);
      if (x.name != null && (typeof x.name !== "string" || words(x.name) > 8)) e(`${field} ${k}: name must be a short string`);
      q(`${field} ${k}`, x.quote); if (extra) extra(x); } };
  list("tools", "tool_class", Object.keys(S.tool_classes), Object.keys(S.tool_stances));
  list("data", "data_type", Object.keys(S.data_types), Object.keys(S.data_stances));
  list("safeguards", "value", Object.keys(S.safeguards));
  list("legal", "value", Object.keys(S.legal));
  return { errs, doc: errs.length ? null : j };
}
function run(dirs, opts) { const all = { errs: [], docs: [] }; const files = dirs.flatMap((d) => (fs.statSync(d).isDirectory() ? fs.readdirSync(d).filter((f) => f.endsWith(".json") && !f.endsWith("-input.json")).map((f) => path.join(d, f)) : [d])); for (const f of files) { const r = validateFile(f, opts); all.errs.push(...r.errs); if (r.doc) all.docs.push(r.doc); } all.n = files.length; return all; }
module.exports = { validateFile, run };
if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2); const oi = rest.indexOf("--out"); const out = oi >= 0 ? rest.splice(oi, 2)[1] : path.join(ROOT, "toolsdata.json");
  if (!["validate", "merge"].includes(cmd) || !rest.length) { console.error("usage: node policy/toolsdata.js validate|merge <dir...> [--out file]"); process.exit(2); }
  const r = run(rest); r.errs.forEach((m) => console.log("ERROR " + m)); const n = (f) => r.docs.reduce((s, d) => s + (d[f] || []).length, 0);
  console.log(`${r.n} documents, ${n("tools")} tool rows, ${n("data")} data rows, ${n("safeguards")} safeguards, ${n("legal")} legal, ${r.errs.length} errors`);
  if (cmd === "merge" && !r.errs.length) { fs.writeFileSync(out, JSON.stringify(r.docs, null, 1) + "\n"); console.log("wrote", out); }
  process.exit(r.errs.length ? 1 : 0);
}
