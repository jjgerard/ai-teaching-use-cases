// Registers the international pilot documents (archive5) in documents.json / institutions.json. Run from repo root.
const fs = require("fs"), path = require("path"); const P = "data/policy/", R = P + "run1/";
const docs = JSON.parse(fs.readFileSync(P + "documents.json")), insts = JSON.parse(fs.readFileSync(P + "institutions.json"));
const sample = Object.fromEntries(JSON.parse(fs.readFileSync(R + "intl/sample.json")).map((s) => [s.doc_id, s]));
const man = JSON.parse(fs.readFileSync(R + "archive5/manifest.json")); const have = new Set(docs.map((d) => d.doc_id)); let n = 0;
for (const m of man) {
  if (m.status !== "ok" || have.has(m.doc_id)) continue; const s = sample[m.doc_id]; if (!s) { console.log("no sample row", m.doc_id); continue; }
  const inst = m.doc_id.replace(/-students-genai-202610$/, "");
  if (!insts.find((i) => i.institution_id === inst)) insts.push({ institution_id: inst, name: s.name, country: s.country, region: s.country_name, sector: "university" });
  docs.push({ doc_id: m.doc_id, institution_id: inst, url_id: inst + "-students-genai", level: "institution", audience: ["students_all"], status: "live", format: /pdf/i.test(m.content_type) ? "pdf" : "webpage", published: null, last_updated: null, date_known: false, retrieved: m.retrieved, word_count: m.words, domains: ["assessed_work"], url: m.final_url || m.url });
  fs.copyFileSync(R + "archive5/snapshots/" + m.doc_id + ".txt", P + "snapshots/" + m.doc_id + ".txt"); n++;
}
fs.writeFileSync(P + "documents.json", JSON.stringify(docs, null, 1) + "\n"); fs.writeFileSync(P + "institutions.json", JSON.stringify(insts, null, 1) + "\n"); console.log("registered", n);
