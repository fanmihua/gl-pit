import assert from "node:assert/strict";
import test from "node:test";
import { createMobileEyesOrbits } from "../src/features/home/useMobileEyesOrbits.js";

const cards = [
  { left: 190, top: 0, width: 145, height: 145 },
  { left: 10, top: 70, width: 125, height: 84 },
  { left: 210, top: 218, width: 125, height: 114 },
  { left: 14, top: 272, width: 125, height: 84 },
];
const size = { width: 346, height: 356 };
const coordinates = (path) => path.match(/-?\d+(?:\.\d+)?/g).map(Number);
const center = (card) => [card.left + card.width / 2, card.top + card.height / 2];

test("second-screen curves pass through all four mobile stickers", () => {
  const { solid, dashed, viewBox } = createMobileEyesOrbits(cards, size);
  assert.equal(viewBox, "0 0 346 356");
  assert.deepEqual(coordinates(solid).slice(0, 2), center(cards[3]));
  assert.deepEqual(coordinates(solid).slice(6, 8), center(cards[1]));
  assert.deepEqual(coordinates(solid).slice(-2), center(cards[0]));
  assert.deepEqual(coordinates(dashed).slice(0, 2), center(cards[0]));
  assert.deepEqual(coordinates(dashed).slice(6, 8), center(cards[2]));
  assert.deepEqual(coordinates(dashed).slice(-2), center(cards[3]));
  [solid, dashed].forEach((path) => coordinates(path).forEach((value, index) => {
    assert.ok(Number.isFinite(value) && value >= 0 && value <= (index % 2 ? size.height : size.width));
  }));
});

test("second-screen paths resize with their local collage container", () => {
  const scale = 0.75;
  const resize = (box) => Object.fromEntries(Object.entries(box).map(([key, value]) => [key, value * scale]));
  const before = createMobileEyesOrbits(cards, size);
  const after = createMobileEyesOrbits(cards.map(resize), resize(size));
  ["solid", "dashed"].forEach((key) => coordinates(after[key]).forEach((value, index) => {
    assert.ok(Math.abs(value - coordinates(before[key])[index] * scale) < 0.00001);
  }));
});
