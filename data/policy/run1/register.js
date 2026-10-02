// Registers archived student-layer documents (baseline metadata only) in documents.json / institutions.json and
// copies their snapshots into data/policy/snapshots. Coding agents propose corrections (domains, audience, dates,
// format) in <OUT>/<doc_id>.registration.json; those are merged by apply-registration.js after review.
// Baseline is conservative: students_all, live, date_known:false (a date is only recorded once verified in the snapshot).
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const sample = require("./sample.json");
const byDoc = new Map(sample.map((r) => [r.doc_id, r]));
const docs = require("../documents.json"), insts = require("../institutions.json");
const have = new Set(docs.map((d) => d.doc_id));
const SKIP = { "ravensbourne-london-students-genai-202610": "snapshot is the whole 85,000-word academic regulations PDF with 2 AI mentions: needs a section extract, deferred" };
const REGION = { England: "GB-ENG", Scotland: "GB-SCT", Wales: "GB-WLS", "Northern Ireland": "GB-NIR", Ireland: "IE" };
let added = 0; const skipped = [];
for (const dir of ["trial", "run1/archive"]) {
  const man = require(path.join(root, dir, "manifest.json"));
  for (const m of man) {
    if (m.status !== "ok" || have.has(m.doc_id)) continue;
    if (SKIP[m.doc_id]) { skipped.push([m.doc_id, SKIP[m.doc_id]]); continue; }
    const s = byDoc.get(m.doc_id) || [...byDoc.values()].find((r) => r.doc_id === m.doc_id);
    if (!s) { console.error("no sample row for", m.doc_id); continue; }
    const inst = m.doc_id.replace(/-students-genai-202610$/, "");
    if (!insts.find((i) => i.institution_id === inst)) insts.push({ institution_id: inst, name: s.name, country: s.region === "Ireland" ? "IE" : "GB", region: REGION[s.region], sector: "university" });
    docs.push({ doc_id: m.doc_id, institution_id: inst, url_id: inst + "-students-genai", level: "institution", audience: ["students_all"], status: "live", format: /pdf/i.test(m.content_type) ? "pdf" : "webpage", published: null, last_updated: null, date_known: false, retrieved: m.retrieved, word_count: m.words, domains: ["assessed_work"], url: m.final_url || m.url });
    fs.copyFileSync(path.join(root, dir, "snapshots", m.doc_id + ".txt"), path.join(root, "snapshots", m.doc_id + ".txt"));
    added++;
  }
}
fs.writeFileSync(path.join(root, "documents.json"), JSON.stringify(docs, null, 1) + "\n");
fs.writeFileSync(path.join(root, "institutions.json"), JSON.stringify(insts, null, 1) + "\n");
console.log("registered", added, "documents; skipped", skipped);
