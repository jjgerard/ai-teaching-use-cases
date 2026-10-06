// Registers second documents (archive3) in documents.json, tied to the institution of the first document. Run from repo root.
const fs = require("fs"), path = require("path"); const P = "data/policy/", R = P + "run1/";
const docs = JSON.parse(fs.readFileSync(P + "documents.json")), man = JSON.parse(fs.readFileSync(R + "archive3/manifest.json"));
const inst = {}; for (const d of fs.readdirSync(R + "discovery2")) { const f = R + "discovery2/" + d + "/input.json"; if (fs.existsSync(f)) for (const i of JSON.parse(fs.readFileSync(f))) inst[i.name] = i.first_doc_id; }
const tg = JSON.parse(fs.readFileSync(R + "archive3/targets.json")); const nameOf = Object.fromEntries(tg.map((t) => [t.doc_id, t.institution]));
const first = Object.fromEntries(docs.map((d) => [d.doc_id, d])); const have = new Set(docs.map((d) => d.doc_id)); const kinds = {}; let n = 0;
for (const m of man) {
  if (m.status !== "ok" || have.has(m.doc_id)) continue;
  const f = first[inst[nameOf[m.doc_id]]]; if (!f) { console.log("no first doc for", m.doc_id); continue; }
  const kind = m.doc_id.replace(/^.*-d2-/, "").replace(/-202610$/, "").replace(/-/g, "_");
  docs.push({ doc_id: m.doc_id, institution_id: f.institution_id, url_id: f.institution_id + "-d2-" + kind, level: "institution", audience: ["students_all"], status: "live", format: /pdf/i.test(m.content_type) ? "pdf" : "webpage", published: null, last_updated: null, date_known: false, retrieved: m.retrieved, word_count: m.words, domains: ["assessed_work"] });
  kinds[m.doc_id] = { kind, first_doc_id: f.doc_id, institution: nameOf[m.doc_id] };
  fs.copyFileSync(R + "archive3/snapshots/" + m.doc_id + ".txt", P + "snapshots/" + m.doc_id + ".txt"); n++;
}
fs.writeFileSync(P + "documents.json", JSON.stringify(docs, null, 1) + "\n"); fs.writeFileSync(R + "archive3/kinds.json", JSON.stringify(kinds, null, 1)); console.log("registered", n);
