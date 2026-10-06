// Maps the v1 point classifications and v1 audit results onto the v2 vocabulary (no model calls).
// Writes data/policy/run1/claims/v2/remap/remap.json (claims format) and data/policy/run1/audit-v2/remap/*.json (presence format).
const fs = require("fs"), path = require("path");
const rd = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const v2 = rd("data/policy/run1/claims/statement-types.v2.json"); const map = v2.v1_to_v2;
const claims = rd("data/policy/claims.json");
const rows = claims.map((r) => {
  let a = map[r.claim] === undefined ? r.claim : map[r.claim]; let b = r.claim2 == null ? null : (map[r.claim2] === undefined ? r.claim2 : map[r.claim2]);
  if (r.claim === "unclassified") a = "unclassified";
  if (a === b) b = null;
  if (a === null) { a = b; b = null; }   // retired first claim: promote the second
  if (a === null || a === undefined) return { ref: r.ref, claim: "unclassified", claim2: null, fit: "none", suggest: r.suggest || "type retired in v2" };
  const fit = a === "unclassified" ? "none" : r.fit === "none" ? "partial" : r.fit;
  return { ref: r.ref, claim: a, claim2: a === "unclassified" ? null : b, fit, suggest: fit === "clear" ? null : r.suggest };
});
fs.mkdirSync("data/policy/run1/claims/v2/remap", { recursive: true });
fs.writeFileSync("data/policy/run1/claims/v2/remap/remap.json", JSON.stringify({ coder: "remap-v1-to-v2", rows }, null, 1));
const P = rd("data/policy/presence.json"); const by = {};
for (const x of P.found) (by[x.doc_id] ??= { found: new Map(), unsure: new Map(), coder: x.coder });
for (const x of P.unsure) (by[x.doc_id] ??= { found: new Map(), unsure: new Map(), coder: x.coder });
for (const x of P.found) { const t = map[x.type]; if (t && !by[x.doc_id].found.has(t)) by[x.doc_id].found.set(t, { type: t, quote: x.quote, anchor: x.anchor ?? null }); }
for (const x of P.unsure) { const t = map[x.type]; if (t && !by[x.doc_id].found.has(t) && !by[x.doc_id].unsure.has(t)) by[x.doc_id].unsure.set(t, { type: t, quote: x.quote, why: x.why || "borderline" }); }
fs.mkdirSync("data/policy/run1/audit-v2/remap", { recursive: true });
for (const [d, o] of Object.entries(by)) fs.writeFileSync(`data/policy/run1/audit-v2/remap/${d}.json`, JSON.stringify({ doc_id: d, coder: "remap-v1-to-v2", checked_types: 66, found: [...o.found.values()], unsure: [...o.unsure.values()] }));
console.log("claims rows", rows.length, "docs", Object.keys(by).length);
