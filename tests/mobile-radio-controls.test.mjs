import test from "node:test";
import assert from "node:assert/strict";
import { mobileRadioControls } from "../src/app/mobile-radio-controls.js";

const base = { selectedTrack: { id: "one" }, activePath: "tide-words", playerReady: true, playerError: false, needleDown: true, playbackPhase: "idle" };

test("no selection and radio page retain direct navigation", () => {
  assert.equal(mobileRadioControls({ ...base, selectedTrack: null }).showQuickControls, false);
  assert.equal(mobileRadioControls({ ...base, selectedTrack: null }).disabled, true);
  assert.equal(mobileRadioControls({ ...base, activePath: "radio" }).showQuickControls, false);
  assert.equal(mobileRadioControls(base).showQuickControls, true);
});

test("only real playing rotates the icon; cueing can still be paused", () => {
  const playing = mobileRadioControls({ ...base, playbackPhase: "playing" });
  assert.equal(playing.isPlaying, true);
  assert.equal(playing.action, "暂停音乐");
  const buffering = mobileRadioControls({ ...base, playbackPhase: "cueing" });
  assert.equal(buffering.isPlaying, false);
  assert.equal(buffering.canPause, true);
  assert.equal(buffering.status, "正在缓冲");
});

test("paused and waiting-for-needle states keep a working play action", () => {
  assert.equal(mobileRadioControls(base).action, "继续播放音乐");
  const waiting = mobileRadioControls({ ...base, needleDown: false });
  assert.equal(waiting.action, "播放音乐");
  assert.equal(waiting.status, "等待播放");
  assert.equal(waiting.disabled, false);
});

test("playback errors expose retry without a fake playing state", () => {
  const error = mobileRadioControls({ ...base, playbackPhase: "playing", playerError: true });
  assert.equal(error.isPlaying, false);
  assert.equal(error.canPause, false);
  assert.equal(error.action, "重试播放");
  assert.equal(error.disabled, false);
  assert.equal(mobileRadioControls({ ...base, playerReady: false }).disabled, true);
});
