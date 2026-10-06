// Adds the rows from the targeted audit of the eight added uses (uses-new/) to data/policy/uses.json. Idempotent. Run from repo root.
const fs = require("fs"), path = require("path"); const { hasAiLink } = require("./ailink.js");
const U = JSON.parse(fs.readFileSync("data/policy/uses.json", "utf8")); const by = Object.fromEntries(U.map((d) => [d.doc_id, d]));
const NEW = new Set(JSON.parse(fs.readFileSync("data/policy/uses-schema.json", "utf8")).uses.map((u) => u.id)); let added = 0, docs = 0;
for (const b of fs.readdirSync("data/policy/run1/uses-new").filter((d) => /^n\d+$/.test(d))) for (const f of fs.readdirSync("data/policy/run1/uses-new/" + b)) {
  const j = JSON.parse(fs.readFileSync(`data/policy/run1/uses-new/${b}/${f}`, "utf8")); const d = by[j.doc_id]; if (!d) { console.log("no doc", j.doc_id); continue; } docs++;
  for (const u of j.uses || []) { const k = (r) => [r.use, r.context, r.tier || "", r.stance].join("/"); if (d.uses.some((r) => k(r) === k(u))) continue; d.uses.push({ ...u, ai_named: hasAiLink(u.quote) }); added++; } }
fs.writeFileSync("data/policy/uses.json", JSON.stringify(U, null, 1) + "\n"); console.log("docs read", docs, "rows added", added);
