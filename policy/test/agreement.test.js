const test = require("node:test");
const assert = require("node:assert");
const { compare, summarise, kindOf } = require("../agreement.js");
const row = (variable_id, value, doc_id = "d1") => ({ doc_id, variable_id, value });

test("kinds", () => {
  assert.equal(kindOf("not_stated"), "not_stated");
  assert.equal(kindOf(null), "misfit");
  assert.equal(kindOf("required"), "value");
  assert.equal(kindOf(["a", "b"]), "value");
});
test("exact agreement is computed only where both coders gave a value", () => {
  const a = [row("x", "required"), row("y", "not_stated"), row("z", "a")];
  const b = [row("x", "required"), row("y", "not_stated"), row("z", "b")];
  const s = summarise(compare(a, b));
  assert.equal(s.cells, 3);
  assert.equal(s.kindAgreement, 1);
  assert.equal(s.bothSubstantive, 2);
  assert.equal(s.exactAgreement, 0.5);
});
test("multi values compare as sets and report Jaccard", () => {
  const s = summarise(compare([row("m", ["b", "a"])], [row("m", ["a", "c"])]));
  assert.equal(s.exactAgreement, 0);
  assert.ok(Math.abs(s.meanJaccard - 1 / 3) < 1e-9);
  assert.equal(summarise(compare([row("m", ["b", "a"])], [row("m", ["a", "b"])])).exactAgreement, 1);
});
test("a value against not_stated is a kind disagreement", () => {
  assert.equal(summarise(compare([row("x", "required")], [row("x", "not_stated")])).kindAgreement, 0);
});
test("cells present in only one file are ignored", () => {
  assert.equal(summarise(compare([row("x", "a"), row("y", "a")], [row("x", "a")])).cells, 1);
});
