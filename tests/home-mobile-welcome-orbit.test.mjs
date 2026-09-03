import test from "node:test";
import assert from "node:assert/strict";
import { createMobileWelcomeOrbit } from "../src/features/home/useMobileWelcomeOrbit.js";

test("welcome curve connects the replay sign to the actual collage pit center", () => {
  const orbit = createMobileWelcomeOrbit(
    { width: 378, height: 274 },
    { left: 139, top: 46, width: 100, height: 56 },
    { left: -45, top: -18, width: 468, height: 351 },
  );
  assert.equal(orbit.viewBox, "0 0 378 274");
  const points = orbit.path.match(/-?\d+(?:\.\d+)?/g).map(Number);
  assert.deepEqual(points.slice(0, 2), [189, 102]);
  assert.deepEqual(points.slice(-2), [189, -18 + 351 * 0.61]);
  assert.ok(points[3] > points[1]);
  assert.ok(points[5] > points[3]);
  assert.ok(points[7] > points[5]);
});

test("welcome curve follows the local container when resized", () => {
  const group = { width: 378, height: 274 };
  const button = { left: 139, top: 46, width: 100, height: 56 };
  const portal = { left: -45, top: -18, width: 468, height: 351 };
  const half = (value) => Object.fromEntries(Object.entries(value).map(([key, number]) => [key, number / 2]));
  const first = createMobileWelcomeOrbit(group, button, portal).path.match(/-?\d+(?:\.\d+)?/g).map(Number);
  const second = createMobileWelcomeOrbit(half(group), half(button), half(portal)).path.match(/-?\d+(?:\.\d+)?/g).map(Number);
  first.forEach((number, index) => assert.ok(Math.abs(number / 2 - second[index]) < 0.0001));
});
