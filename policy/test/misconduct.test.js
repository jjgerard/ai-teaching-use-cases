const test = require("node:test"); const assert = require("node:assert");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { validateFile } = require("../misconduct.js");
const real = fs.readFileSync(path.join(__dirname, "..", "..", "data", "policy", "misconduct-schema.json"), "utf8");
function fx(body) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mis-")); fs.mkdirSync(path.join(root, "snapshots"));
  fs.writeFileSync(path.join(root, "snapshots", "d1.txt"), "Submitting AI-generated work as your own is academic misconduct. A case may lead to a mark of zero. You may appeal. Ignorance is no defence.\n");
  fs.writeFileSync(path.join(root, "misconduct-schema.json"), real);
  const f = path.join(root, "d1.json"); fs.writeFileSync(f, JSON.stringify({ doc_id: "d1", coder: "t", scope: "general_misconduct", ...body })); return { root, f };
}
test("valid offence, outcome, process and liability rows pass", () => { const { root, f } = fx({ offences: [{ value: "passing_off", ai_named: true, quote: "Submitting AI-generated work as your own is academic misconduct." }], outcomes: [{ value: "zero_for_work", ai_named: false, quote: "A case may lead to a mark of zero." }], process: [{ value: "appeal", ai_named: false, quote: "You may appeal." }], liability: [{ value: "strict_liability", ai_named: false, quote: "Ignorance is no defence." }] }); assert.deepEqual(validateFile(f, { root }).errs, []); });
test("an empty document with a valid scope passes; a bad scope fails", () => { const a = fx({}); assert.deepEqual(validateFile(a.f, { root: a.root }).errs, []); const b = fx({ scope: "maybe" }); assert.match(validateFile(b.f, { root: b.root }).errs.join(), /scope must be/); });
test("unknown values, missing ai_named, stitched and missing quotes and duplicates are rejected", () => {
  const { root, f } = fx({ offences: [{ value: "nope", ai_named: true, quote: "You may appeal." }, { value: "passing_off", quote: "Ignorance is no defence." }, { value: "undeclared_use", ai_named: false, quote: "Submitting ... misconduct." }, { value: "unauthorised_use", ai_named: false, quote: "Free weekly drop-ins." }], detection: [{ method: "ai_detection_software", stance: "sometimes", ai_named: true, quote: "You may appeal." }, { method: "ai_detection_software", stance: "sometimes", ai_named: true, quote: "You may appeal." }] });
  const e = validateFile(f, { root }).errs.join("\n"); for (const re of [/not in the vocabulary/, /ai_named must be/, /stitch/, /not in the snapshot/, /stance not in/, /listed twice/]) assert.match(e, re);
});
