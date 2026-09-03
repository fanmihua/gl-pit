import test from "node:test";
import assert from "node:assert/strict";
import { buildEvidenceLayout } from "../src/features/community/evidence-layout.js";

test("mobile pins occupy a dedicated row without duplicating or dropping quotes", () => {
  const order = ["pin", "new", "second", "third"];
  const layout = buildEvidenceLayout(order, ["pin"], 2, true);
  assert.deepEqual(layout, [
    { pinned: true, cardIds: ["pin"] },
    { pinned: false, cardIds: ["new", "third"] },
    { pinned: false, cardIds: ["second"] },
  ]);
  assert.deepEqual(layout.flatMap((group) => group.cardIds).sort(), [...order].sort());
});

test("desktop keeps its original row-major distribution including pins", () => {
  assert.deepEqual(buildEvidenceLayout(["pin", "a", "b", "c"], ["pin"], 3, false), [
    { pinned: false, cardIds: ["pin", "c"] },
    { pinned: false, cardIds: ["a"] },
    { pinned: false, cardIds: ["b"] },
  ]);
});

test("zero or multiple pins keep ordering without an empty pinned row", () => {
  assert.equal(buildEvidenceLayout(["a"], [], 2, true).some((group) => group.pinned), false);
  assert.deepEqual(buildEvidenceLayout(["p2", "p1", "a"], ["p1", "p2"], 2, true)[0].cardIds, ["p2", "p1"]);
});
