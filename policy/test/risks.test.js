const test = require("node:test"); const assert = require("node:assert");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { validateFile } = require("../risks.js");
const real = fs.readFileSync(path.join(__dirname, "..", "..", "data", "policy", "risks-schema.json"), "utf8");
function fx(body) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "rk-")); fs.mkdirSync(path.join(root, "snapshots"));
  fs.writeFileSync(path.join(root, "snapshots", "d1.txt"), "AI can invent references. You remain responsible for your final output. Each query uses energy.\n");
  fs.writeFileSync(path.join(root, "risks-schema.json"), real);
  const f = path.join(root, "d1.json"); fs.writeFileSync(f, JSON.stringify({ doc_id: "d1", coder: "t", ...body })); return { root, f };
}
test("valid risk and responsibility rows pass", () => {
  const { root, f } = fx({ risks: [{ risk: "inaccurate_or_fabricated_output", audience: "both", ai_named: true, quote: "AI can invent references." }], responsibilities: [{ duty: "accountable_for_output", bearer: "students", strength: "must", ai_named: false, quote: "You remain responsible for your final output." }] });
  assert.deepEqual(validateFile(f, { root }).errs, []);
});
test("an empty document passes", () => { const a = fx({}); assert.deepEqual(validateFile(a.f, { root: a.root }).errs, []); });
test("unknown values, missing fields, bad quotes and duplicates are rejected", () => {
  const { root, f } = fx({ risks: [{ risk: "nope", audience: "both", ai_named: true, quote: "AI can invent references." }, { risk: "environmental_impact", audience: "both", quote: "Each query uses energy." }, { risk: "environmental_impact", audience: "both", ai_named: true, quote: "Each query uses energy." }, { risk: "bias_or_discrimination", audience: "both", ai_named: true, quote: "AI is biased." }], responsibilities: [{ duty: "verify_output", bearer: "nobody", strength: "must", ai_named: true, quote: "AI can invent references." }] });
  const e = validateFile(f, { root }).errs.join("\n"); for (const re of [/not in the vocabulary/, /ai_named must be/, /not in the snapshot/, /listed twice/, /bearer not/]) assert.match(e, re);
});
