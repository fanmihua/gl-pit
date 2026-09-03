import assert from "node:assert/strict";
import test from "node:test";
import { buildFrequencyCurve } from "../src/features/community/frequency-curve.js";

const points = [[0, 282], [80, 216], [250, 120], [435, 72], [580, 160], [705, 212], [790, 258], [865, 296], [940, 344], [1015, 368], [1060, 373]].map(([x, y]) => ({ x, y }));

test("phone curve passes through every original frequency node", () => {
  const { segments } = buildFrequencyCurve(points);
  assert.equal(segments.length, points.length - 1);
  segments.forEach((segment, index) => {
    assert.deepEqual(segment.start, points[index]);
    assert.deepEqual(segment.end, points[index + 1]);
  });
});

test("phone curve has continuous tangents and no inter-node overshoot", () => {
  const { segments } = buildFrequencyCurve(points);
  segments.forEach(({ start, control1, control2, end }, index) => {
    for (let sample = 0; sample <= 100; sample += 1) {
      const t = sample / 100;
      const y = (1 - t) ** 3 * start.y + 3 * (1 - t) ** 2 * t * control1.y + 3 * (1 - t) * t ** 2 * control2.y + t ** 3 * end.y;
      assert.ok(y >= Math.min(start.y, end.y) - 1e-8 && y <= Math.max(start.y, end.y) + 1e-8);
    }
    if (index > 0) {
      const previous = segments[index - 1];
      const incoming = (previous.end.y - previous.control2.y) / (previous.end.x - previous.control2.x);
      const outgoing = (control1.y - start.y) / (control1.x - start.x);
      assert.ok(Math.abs(incoming - outgoing) < 1e-8);
    }
  });
});

test("flat lines remain flat and invalid coordinates are rejected", () => {
  const { segments } = buildFrequencyCurve([{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }]);
  assert.ok(segments.every(({ control1, control2 }) => control1.y === 2 && control2.y === 2));
  assert.throws(() => buildFrequencyCurve([{ x: 1, y: 0 }, { x: 1, y: 1 }]));
});
