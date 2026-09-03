import assert from "node:assert/strict";
import test from "node:test";
import { createMobileFallingMotion } from "../src/features/home/mobile-falling-motion.js";

const orbits = {
  width: 390,
  portal: { left: -31, top: 484, width: 452, height: 339 },
  cards: [
    { left: 221, top: 100, width: 143, height: 143, rotation: "5deg" },
    { left: 23, top: 117, width: 114, height: 76, rotation: "-7deg" },
    { left: 237, top: 366, width: 123, height: 112, rotation: "8deg" },
    { left: 23, top: 280, width: 114, height: 76, rotation: "-5deg" },
    { left: 62, top: 472, width: 91, height: 91, rotation: "-8deg" },
  ],
};
const coordinates = (path) => path.match(/-?\d+(?:\.\d+)?/g).map(Number);

test("random motion remains stable within a run and changes with a fresh seed", () => {
  assert.deepEqual(createMobileFallingMotion(orbits, 12345), createMobileFallingMotion(orbits, 12345));
  assert.notDeepEqual(createMobileFallingMotion(orbits, 12345), createMobileFallingMotion(orbits, 67890));
  assert.deepEqual(createMobileFallingMotion(null, 12345), []);
});

test("all random curves preserve the initial layout and the same fixed pit center", () => {
  const before = structuredClone(orbits);
  for (let seed = 0; seed < 100; seed++) {
    const motion = createMobileFallingMotion(orbits, seed);
    assert.equal(new Set(motion.map((item) => item.path)).size, 5);
    motion.forEach((item, index) => {
      const points = coordinates(item.path);
      const card = orbits.cards[index];
      assert.deepEqual(points.slice(0, 2), [card.left + card.width / 2, card.top + card.height / 2]);
      assert.deepEqual(points.slice(-2), [195, 484 + 339 * 0.61]);
      assert.ok(points[1] < points[3] && points[3] < points[5] && points[5] < points[7]);
      assert.ok(points.every((value, i) => value >= 0 && value <= (i % 2 ? points[7] : orbits.width)));
      assert.ok(item.duration >= 960 && item.duration <= 1120);
      const spin = Math.abs(item.rotation - Number.parseFloat(card.rotation));
      assert.ok(spin >= 35 && spin <= 95);
    });
  }
  assert.deepEqual(orbits, before);
});

test("resizing preserves the seeded motion character without rerolling", () => {
  const scale = 0.85;
  const resize = (box) => Object.fromEntries(Object.entries(box).map(([key, value]) => [key, typeof value === "number" ? value * scale : value]));
  const small = { width: orbits.width * scale, portal: resize(orbits.portal), cards: orbits.cards.map(resize) };
  const original = createMobileFallingMotion(orbits, 440);
  const resized = createMobileFallingMotion(small, 440);
  resized.forEach((item, index) => {
    assert.equal(item.duration, original[index].duration);
    assert.equal(item.rotation, original[index].rotation);
    assert.equal(item.easing, original[index].easing);
  });
});
