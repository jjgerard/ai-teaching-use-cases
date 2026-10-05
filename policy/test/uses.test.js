const test = require("node:test"); const assert = require("node:assert");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { validateFile } = require("../uses.js");
const real = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "policy", "uses-schema.json"), "utf8"));
function fx(body) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "use-")); fs.mkdirSync(path.join(root, "snapshots"));
  fs.writeFileSync(path.join(root, "snapshots", "d1.txt"), "You may use AI to brainstorm ideas. You must not use AI to write your essay. Acknowledge any use on the coversheet.\n");
  fs.writeFileSync(path.join(root, "uses-schema.json"), JSON.stringify(real));
  const f = path.join(root, "d1.json"); fs.writeFileSync(f, JSON.stringify({ doc_id: "d1", coder: "t", uses: [], ...body })); return { root, f };
}
test("a valid use row and acknowledgement duty pass", () => { const { root, f } = fx({ uses: [{ use: "generate_ideas", context: "study", stance: "permitted", acknowledge: "not_stated", conditions: [], quote: "You may use AI to brainstorm ideas." }], acknowledgement: { duty: { value: "always_required", quote: "Acknowledge any use on the coversheet." }, location: [{ value: "coversheet_or_form", quote: "Acknowledge any use on the coversheet." }] } }); assert.deepEqual(validateFile(f, { root }).errs, []); });
test("the same use can appear once per tier", () => { const base = { use: "generate_ideas", context: "study", stance: "permitted", acknowledge: "not_stated", conditions: [], quote: "You may use AI to brainstorm ideas." }; const { root, f } = fx({ uses: [{ ...base, tier: "green" }, { ...base, tier: "amber" }] }); assert.deepEqual(validateFile(f, { root }).errs, []); const d = fx({ uses: [{ ...base, tier: "green" }, { ...base, tier: "green" }] }); assert.match(validateFile(d.f, { root: d.root }).errs.join(), /listed twice/); });
test("the same use and setting with different stances is allowed", () => { const base = { use: "translate", context: "study", acknowledge: "not_stated", conditions: [], quote: "You may use AI to brainstorm ideas." }; const { root, f } = fx({ uses: [{ ...base, stance: "permitted" }, { ...base, stance: "discouraged" }] }); assert.deepEqual(validateFile(f, { root }).errs, []); });
test("an empty document is valid, a missing uses list is not", () => { const a = fx({}); assert.deepEqual(validateFile(a.f, { root: a.root }).errs, []); const b = fx({ uses: undefined }); assert.match(validateFile(b.f, { root: b.root }).errs.join(), /uses must be a list/); });
test("unknown values, a conditional without a condition, duplicates and bad quotes are rejected", () => {
  const row = { use: "generate_assessed_text", context: "assessed_work", stance: "prohibited", acknowledge: "not_stated", conditions: [], quote: "You must not use AI to write your essay." };
  const { root, f } = fx({ uses: [row, row, { use: "nope", context: "study", stance: "conditional", acknowledge: "maybe", conditions: [], quote: "Free weekly drop-ins." }, { ...row, use: "translate", context: "study", quote: "You may ... brainstorm." }], default_when_silent: { value: "whatever", quote: "You must not use AI to write your essay." } });
  const e = validateFile(f, { root }).errs.join("\n"); for (const re of [/listed twice/, /use not in the vocabulary/, /conditional needs/, /acknowledge must be/, /not in the snapshot/, /stitch/, /default_when_silent: value/]) assert.match(e, re);
});
