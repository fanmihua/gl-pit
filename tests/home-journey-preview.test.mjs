import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { FALLING_DURATION_MS, getHomePreviewScene } from "../src/features/home/home-journey-timing.js";

test("development entry opens welcome and no longer pins the transition", () => {
  assert.equal(getHomePreviewScene("?previewScene=falling", true), null);
  assert.equal(getHomePreviewScene("?previewScene=eyes", true), null);
  assert.equal(getHomePreviewScene("", true), null);
  assert.equal(getHomePreviewScene("?previewScene=welcome", true), "welcome");
});

test("production ignores inspection parameters and preserves the transition duration", () => {
  assert.equal(getHomePreviewScene("?previewScene=falling", false), null);
  assert.equal(getHomePreviewScene("?previewScene=eyes", false), null);
  assert.equal(getHomePreviewScene("?previewScene=welcome", false), null);
  assert.equal(FALLING_DURATION_MS, 1200);
});

test("mobile travel and zoom have one continuous segment, separate from fading", () => {
  const css = readFileSync(new URL("../src/home-page.css", import.meta.url), "utf8");
  for (const name of ["falling-card-pull-mobile", "falling-camera-push-mobile"]) {
    const block = css.match(new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)^\\}`, "m"))[1];
    const offsets = [...block.matchAll(/^\s*(\d+)%\s*\{/gm)].map((match) => Number(match[1]));
    assert.deepEqual(offsets, [0, 100]);
    assert.ok(!block.includes("opacity"));
  }
  assert.match(css, /\.is-scene-falling \.falling-card\s*\{\s*--fall-card-delay: 0ms;/);
});
