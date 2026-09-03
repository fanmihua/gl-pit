import test from "node:test";
import assert from "node:assert/strict";
import { createDesktopWelcomeOrbit, placeDesktopWelcomePortal, pointOnWelcomeCurve } from "../src/features/home/useDesktopWelcomeOrbit.js";

for (const [width, height] of [[960, 800], [1440, 900], [1920, 1080], [1440, 1400]]) {
  test(`desktop welcome curve and labels share the actual pit at ${width}x${height}`, () => {
    const button = { left: width * 0.67 - 50, top: height * 0.035, width: 100, height: 60 };
    const pitWidth = Math.min(1240, width * 0.74);
    const portal = { left: width * 0.51 - pitWidth / 2, top: height * -0.05, width: pitWidth, height: pitWidth * 0.75 };
    const cardWidth = Math.min(340, Math.max(250, width * 0.2));
    const card = { left: width * 0.99 - cardWidth, width: cardWidth };
    const orbit = createDesktopWelcomeOrbit({ width, height }, button, portal, card, 90);
    assert.equal(orbit.viewBox, `0 0 ${width} ${height}`);
    assert.deepEqual(orbit.points[3], { x: portal.left + pitWidth / 2, y: portal.top + portal.height * 0.61 });
    const numbers = orbit.path.match(/-?\d+(?:\.\d+)?/g).map(Number);
    assert.deepEqual(numbers.slice(-2), [orbit.points[3].x, orbit.points[3].y]);
    orbit.stops.forEach((stop, index) => {
      assert.deepEqual(stop, pointOnWelcomeCurve(orbit.points, [0, 0.45, 0.77][index]));
      assert.ok(stop.x + 45 + 24 <= card.left - card.width * 0.06 + 0.001);
      assert.ok(stop.y < orbit.points[3].y);
      if (index) assert.ok(stop.y > orbit.stops[index - 1].y + 30);
    });
  });
}

test("taller desktop scenes place the pit lower without crossing the navigation", () => {
  const portal = { left: 202, top: -45, width: 1066, height: 800 };
  const normal = placeDesktopWelcomePortal(portal, { top: 117, height: 211 }, { top: 694 });
  const tall = placeDesktopWelcomePortal(portal, { top: 182, height: 211 }, { top: 1169 });
  const normalCenter = normal.top + normal.height * 0.61;
  const tallCenter = tall.top + tall.height * 0.61;
  assert.ok(normal.top > portal.top);
  assert.ok(tallCenter > normalCenter + 200);
  for (const [placed, limit] of [[normal, 694], [tall, 1169]]) {
    assert.equal(placed.left, portal.left);
    assert.equal(placed.width, portal.width);
    assert.equal(placed.height, portal.height);
    assert.ok(placed.top + placed.height * 0.61 + placed.width * 0.14 <= limit - 24);
  }
  // Position is independent of the previous frame's CSS top, preventing drift.
  assert.deepEqual(placeDesktopWelcomePortal(tall, { top: 182, height: 211 }, { top: 1169 }), tall);
});
