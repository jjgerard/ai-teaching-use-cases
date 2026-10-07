// Registers archive7 (England second documents and international draw 2) in documents.json / institutions.json and kinds.json. Run from repo root.
const fs = require("fs"); const P = "data/policy/", R = P + "run1/";
const docs = JSON.parse(fs.readFileSync(P + "documents.json")), insts = JSON.parse(fs.readFileSync(P + "institutions.json"));
const man = JSON.parse(fs.readFileSync(R + "archive7/manifest.json")), tg = Object.fromEntries(JSON.parse(fs.readFileSync(R + "archive7/targets.json")).map((t) => [t.doc_id, t]));
const sample = Object.fromEntries(JSON.parse(fs.readFileSync(R + "intl2/sample.json")).map((s) => [s.doc_id, s]));
const first = Object.fromEntries(docs.map((d) => [d.doc_id, d])); const have = new Set(docs.map((d) => d.doc_id));
const kindsFile = R + "archive3/kinds.json"; const kinds = JSON.parse(fs.readFileSync(kindsFile)); let n = 0, ni = 0;
for (const m of man) {
  if (m.status !== "ok" || have.has(m.doc_id)) continue; const t = tg[m.doc_id]; if (!t) { console.log("no target", m.doc_id); continue; }
  const common = { level: "institution", audience: ["students_all"], status: "live", format: /pdf/i.test(m.content_type) ? "pdf" : "webpage", published: null, last_updated: null, date_known: false, retrieved: m.retrieved, word_count: m.words, domains: ["assessed_work"], url: m.final_url || m.url };
  if (t.track === "england-d2") {
    const f = first[t.first_doc_id]; if (!f) { console.log("no first doc", m.doc_id); continue; }
    const kind = m.doc_id.replace(/^.*-d2-/, "").replace(/-202610$/, "").replace(/-/g, "_");
    docs.push({ doc_id: m.doc_id, institution_id: f.institution_id, url_id: f.institution_id + "-d2-" + kind, ...common });
    kinds[m.doc_id] = { kind, first_doc_id: f.doc_id, institution: t.institution };
  } else {
    const s = sample[m.doc_id]; if (!s) { console.log("no sample row", m.doc_id); continue; }
    const inst = m.doc_id.replace(/-students-genai-202610$/, "");
    if (!insts.find((i) => i.institution_id === inst)) { insts.push({ institution_id: inst, name: s.name, country: s.country, region: s.country_name, sector: "university" }); ni++; }
    docs.push({ doc_id: m.doc_id, institution_id: inst, url_id: inst + "-students-genai", ...common });
  }
  fs.copyFileSync(R + "archive7/snapshots/" + m.doc_id + ".txt", P + "snapshots/" + m.doc_id + ".txt"); n++;
}
fs.writeFileSync(P + "documents.json", JSON.stringify(docs, null, 1) + "\n"); fs.writeFileSync(P + "institutions.json", JSON.stringify(insts, null, 1) + "\n"); fs.writeFileSync(kindsFile, JSON.stringify(kinds, null, 1)); console.log("registered", n, "new institutions", ni);
