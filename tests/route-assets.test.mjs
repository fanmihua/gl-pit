import test from "node:test";
import assert from "node:assert/strict";
import { firstScreenImages, isFirstScreenImage } from "../src/app/route-assets.js";

const viewport = { width: 390, height: 844 };
const style = (image) => image.style;
function image({ src = "cover.webp", left = 0, top = 80, width = 120, height = 90, display = "block", visibility = "visible" } = {}) {
  return {
    src, style: { display, visibility },
    getClientRects: () => display === "none" ? [] : [{}],
    getBoundingClientRect: () => ({ left, top, width, height, right: left + width, bottom: top + height }),
  };
}

test("mobile-hidden decorations and offscreen film frames never block the first screen", () => {
  for (const item of [image({ display: "none" }), image({ visibility: "hidden" }), image({ left: 430 }), image({ top: 900 }), image({ left: -200 })]) {
    assert.equal(isFirstScreenImage(item, viewport, style), false);
  }
  assert.equal(isFirstScreenImage(image({ left: 340 }), viewport, style), true);
});

test("visible images still wait before intrinsic height becomes available", () => {
  assert.equal(isFirstScreenImage(image({ height: 0 }), viewport, style), true);
});

test("filter visibility before deduplicating the same asset across mobile and desktop", () => {
  const visible = image();
  const root = { querySelectorAll: () => [image({ display: "none" }), visible, image()] };
  const selected = firstScreenImages(root, viewport, style);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].src, visible.src);
  assert.equal(selected[0].style.display, "block");
});
