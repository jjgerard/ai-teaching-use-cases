// Seeded split of institutions (documents) into a derivation half and a held-out half, so the statement-type list is tested on documents it was not built from.
const fs = require("fs"), path = require("path"); const root = path.join(__dirname, "..", "..");
const pts = JSON.parse(fs.readFileSync(path.join(root, "points.json")));
const docs = [...new Set(pts.map((p) => p.doc_id))].sort();
let a = 20261004; const rnd = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
for (let i = docs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [docs[i], docs[j]] = [docs[j], docs[i]]; }
const half = new Set(docs.slice(0, Math.floor(docs.length / 2)));
const row = (p) => ({ ref: p.doc_id + ":" + p.point_id, quote: p.quote, topic: p.topic, force: p.force, addressee: p.addressee });
const A = pts.filter((p) => half.has(p.doc_id) && p.specific).map(row), B = pts.filter((p) => !half.has(p.doc_id) && p.specific).map(row);
fs.writeFileSync(path.join(__dirname, "derive-input.json"), JSON.stringify(A));
fs.writeFileSync(path.join(__dirname, "heldout-input.json"), JSON.stringify(B));
fs.writeFileSync(path.join(__dirname, "split.json"), JSON.stringify({ seed: 20261004, derive_docs: [...half].sort(), heldout_docs: docs.filter((d) => !half.has(d)).sort() }, null, 1));
console.log("derive:", half.size, "docs,", A.length, "specific points; held-out:", docs.length - half.size, "docs,", B.length, "points");
