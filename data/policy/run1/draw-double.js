// Seeded random draw of documents for independent second coding (about 10%), over ALL documents coded in this run.
const fs = require("fs"), path = require("path");
const dir = path.join(__dirname, "codes");
const docs = [];
for (const b of fs.readdirSync(dir)) for (const f of fs.readdirSync(path.join(dir, b))) if (f.endsWith(".json") && !f.endsWith(".registration.json")) docs.push(f.replace(/\.json$/, ""));
docs.sort();
let a = 20261003; const rnd = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const x = [...docs]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
const n = Math.max(5, Math.round(docs.length * 0.1)); const pick = x.slice(0, n);
fs.writeFileSync(path.join(__dirname, "double-sample.json"), JSON.stringify({ seed: 20261003, population: docs.length, picked: pick }, null, 1) + "\n");
console.log(docs.length, "coded docs; double-coding", pick.join(", "));
