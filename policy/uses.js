// Uses and acknowledgement audit: validate and merge per-document files (see policy/USES-BRIEF.md).
//   node policy/uses.js validate <dir...>
//   node policy/uses.js merge <dir...> [--out file]     writes data/policy/uses.json
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.join(__dirname, "..", "data", "policy");
const norm = (s) => String(s).toLowerCase().replace(/[‘’“”'"`\-‐-―\s]+/g, " ").trim();
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
function validateFile(file, { root = ROOT, schemaFile } = {}) {
  const errs = []; let j; try { j = JSON.parse(fs.readFileSync(file, "utf8")); } catch { return { errs: [`${file}: not valid JSON`], doc: null }; }
  const id = j.doc_id; const e = (m) => errs.push(`${id || file}: ${m}`); if (!id) { e("no doc_id"); return { errs, doc: null }; }
  const S = JSON.parse(fs.readFileSync(schemaFile || path.join(root, "uses-schema.json"), "utf8"));
  const sf = path.join(root, "snapshots", id + ".txt"); const snap = fs.existsSync(sf) ? norm(fs.readFileSync(sf, "utf8")) : null; if (snap === null) e("no snapshot");
  const uses = new Set(S.uses.map((u) => u.id)); const A = S.acknowledgement;
  const q = (where, quote) => { if (!quote) return e(`${where}: quote is required`); if (words(quote) > 60) e(`${where}: quote over 60 words`); if (/\.\.\.|…|\[\s*…\s*\]/.test(quote)) e(`${where}: quote must not stitch passages`); else if (snap !== null && !snap.includes(norm(quote))) e(`${where}: quote is not in the snapshot`); };
  const one = (where, v, allowed) => { if (v == null) return; if (typeof v !== "object") return e(`${where}: must be {value, quote} or null`); if (!allowed.includes(v.value)) e(`${where}: value ${JSON.stringify(v.value)} not in ${allowed.join("|")}`); q(where, v.quote); };
  const many = (where, list, allowed) => { if (list == null) return; if (!Array.isArray(list)) return e(`${where}: must be a list`); const seen = new Set(); for (const x of list) { if (!allowed.includes(x.value ?? x.use)) e(`${where}: ${JSON.stringify(x.value ?? x.use)} not in vocabulary`); const k = x.value ?? x.use; if (seen.has(k)) e(`${where}: ${k} listed twice`); seen.add(k); q(where + " " + k, x.quote); } };
  if (!j.coder) e("coder is required"); if (!Array.isArray(j.uses)) e("uses must be a list (empty if nothing is stated)");
  const seen = new Set(); for (const u of j.uses || []) {
    const k = `${u.use}/${u.context}${u.tier ? "/" + u.tier : ""}/${u.stance}`; const ue = (m) => e(`use ${k}: ${m}`);
    if (!uses.has(u.use)) ue("use not in the vocabulary"); if (u.tier != null && words(u.tier) > 4) ue("tier is at most 4 words"); if (!S.contexts[u.context]) ue("context not in the vocabulary"); if (seen.has(k)) ue("listed twice"); seen.add(k);
    if (!S.stances[u.stance]) ue("stance not in the vocabulary"); if (!S.acknowledge[u.acknowledge]) ue("acknowledge must be required|not_required|not_stated");
    if (u.stance === "conditional" && !(u.conditions || []).length) ue("conditional needs at least one condition"); for (const c of u.conditions || []) if (!S.conditions[c]) ue(`condition ${c} not in the vocabulary`);
    q(`use ${k}`, u.quote);
  }
  one("default_when_silent", j.default_when_silent, Object.keys(S.default_when_silent)); many("decided_by", j.decided_by, Object.keys(S.decided_by));
  const a = j.acknowledgement; if (a != null) {
    one("acknowledgement.duty", a.duty, Object.keys(A.duty)); many("acknowledgement.contents", a.contents, A.contents); many("acknowledgement.location", a.location, A.location);
    one("acknowledgement.records", a.records, Object.keys(A.records)); one("acknowledgement.referencing", a.referencing, Object.keys(A.referencing)); one("acknowledgement.consequence", a.consequence, Object.keys(A.consequence));
    if (a.exempt != null) many("acknowledgement.exempt", a.exempt.map((x) => ({ value: x.what, quote: x.quote })), [...uses, ...A.exempt_other]);
  }
  return { errs, doc: errs.length ? null : j };
}
function run(dirs, opts) { const all = { errs: [], docs: [] }; const files = dirs.flatMap((d) => (fs.statSync(d).isDirectory() ? fs.readdirSync(d).filter((f) => f.endsWith(".json") && !f.endsWith("-input.json")).map((f) => path.join(d, f)) : [d])); for (const f of files) { const r = validateFile(f, opts); all.errs.push(...r.errs); if (r.doc) all.docs.push(r.doc); } all.n = files.length; return all; }
module.exports = { validateFile, run };
if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2); const oi = rest.indexOf("--out"); const out = oi >= 0 ? rest.splice(oi, 2)[1] : path.join(ROOT, "uses.json");
  if (!["validate", "merge"].includes(cmd) || !rest.length) { console.error("usage: node policy/uses.js validate|merge <dir...> [--out file]"); process.exit(2); }
  const r = run(rest); r.errs.forEach((m) => console.log("ERROR " + m)); console.log(`${r.n} documents, ${r.docs.reduce((n, d) => n + d.uses.length, 0)} use rows, ${r.errs.length} errors`);
  if (cmd === "merge" && !r.errs.length) { fs.writeFileSync(out, JSON.stringify(r.docs, null, 1) + "\n"); console.log("wrote", out); }
  process.exit(r.errs.length ? 1 : 0);
}
