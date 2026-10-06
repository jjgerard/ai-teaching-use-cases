// Guidance points: validate and merge per-document extraction files (see policy/POINTS-BRIEF.md).
//   node policy/points.js validate <dir...>            check files against the brief and the archived snapshots
//   node policy/points.js merge <dir...> [--out file]   validate, then write data/policy/points.json (rows flattened, one per point)
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.join(__dirname, "..", "data", "policy");
const FORCE = ["must", "must_not", "may", "should", "should_not", "encouraged", "explains", "commits"];
const ADDRESSEE = ["student", "staff", "both", "institution"];
const TOPIC = ["permitted_uses", "prohibited_uses", "disclosure_and_acknowledgement", "referencing_and_citation", "accuracy_and_verification", "data_privacy_and_confidentiality", "integrity_and_consequences", "who_decides_course_rules", "assessment_categories_and_design", "detection_tools", "tools_provided_or_recommended", "support_and_training", "ethics_bias_environment", "accessibility_and_equity", "staff_duties", "review_and_governance", "other"];
const norm = (s) => String(s).toLowerCase().replace(/[‘’“”'"`\-‐-―\s]+/g, " ").trim();
const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

function validateFile(file, { root = ROOT } = {}) {
  const errs = []; let j;
  try { j = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return { errs: [`${file}: not valid JSON`], rows: [] }; }
  const id = j.doc_id; const e = (m) => errs.push(`${id || file}: ${m}`);
  if (!id) { e("no doc_id"); return { errs, rows: [] }; }
  const docs = JSON.parse(fs.readFileSync(path.join(root, "documents.json"), "utf8"));
  if (!docs.find((d) => d.doc_id === id)) e("doc_id is not in documents.json");
  const snapFile = path.join(root, "snapshots", id + ".txt");
  const snap = fs.existsSync(snapFile) ? norm(fs.readFileSync(snapFile, "utf8")) : null; if (snap === null) e("no snapshot");
  if (!j.coder) e("coder is required"); if (!j.extracted_at) e("extracted_at is required");
  const pts = j.points || [];
  if (!pts.length && !j.no_points_reason) e("no points and no no_points_reason");
  if (pts.length && j.no_points_reason) e("has points and a no_points_reason");
  if (pts.length > 20) e("more than 20 points");
  const seen = new Set(); const rows = [];
  for (const p of pts) {
    const k = p.point_id || "?"; const pe = (m) => e(`${k}: ${m}`);
    if (!/^p\d{2}$/.test(p.point_id || "")) pe("point_id must look like p01"); else if (seen.has(k)) pe("duplicate point_id"); seen.add(k);
    if (!p.quote || typeof p.quote !== "string") pe("quote is required");
    else { if (words(p.quote) > 60) pe(`quote is ${words(p.quote)} words (max 60)`); if (/\.\.\.|…/.test(p.quote)) pe("quote must not stitch passages with an ellipsis"); if (snap !== null && !snap.includes(norm(p.quote))) pe("quote is not in the snapshot"); }
    if (!ADDRESSEE.includes(p.addressee)) pe(`addressee ${JSON.stringify(p.addressee)} is not one of ${ADDRESSEE.join("|")}`);
    if (!FORCE.includes(p.force)) pe(`force ${JSON.stringify(p.force)} is not one of ${FORCE.join("|")}`);
    if (!TOPIC.includes(p.topic)) pe(`topic ${JSON.stringify(p.topic)} is not in the list`);
    if (typeof p.specific !== "boolean") pe("specific must be true or false");
    if (!p.gist || words(p.gist) > 25) pe("gist is required and at most 25 words");
    if (p.anchor != null && typeof p.anchor !== "string") pe("anchor must be a string or null");
    rows.push({ doc_id: id, point_id: p.point_id, quote: p.quote, anchor: p.anchor ?? null, addressee: p.addressee, force: p.force, topic: p.topic, specific: p.specific, gist: p.gist, coder: j.coder, extracted_at: j.extracted_at });
  }
  return { errs, rows, doc_id: id, none: j.no_points_reason || null };
}
function files(dirs) { return dirs.flatMap((d) => (fs.statSync(d).isDirectory() ? fs.readdirSync(d).filter((f) => f.endsWith(".json")).map((f) => path.join(d, f)) : [d])); }
function run(dirs, opts) { const all = { errs: [], rows: [], docs: [], none: [] }; for (const f of files(dirs)) { const r = validateFile(f, opts); all.errs.push(...r.errs); all.rows.push(...r.rows); if (r.doc_id) (r.none ? all.none : all.docs).push(r.doc_id); } return all; }
module.exports = { validateFile, run, FORCE, TOPIC, ADDRESSEE };
if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2); const oi = rest.indexOf("--out"); const out = oi >= 0 ? rest.splice(oi, 2)[1] : path.join(ROOT, "points.json");
  if (!["validate", "merge"].includes(cmd) || !rest.length) { console.error("usage: node policy/points.js validate|merge <dir...> [--out file]"); process.exit(2); }
  const r = run(rest); for (const m of r.errs) console.log("ERROR " + m);
  console.log(`${r.docs.length} documents with points, ${r.none.length} with none, ${r.rows.length} points, ${r.errs.length} errors`);
  if (cmd === "merge" && !r.errs.length) { fs.writeFileSync(out, JSON.stringify(r.rows, null, 1) + "\n"); console.log("wrote", out); }
  process.exit(r.errs.length ? 1 : 0);
}
