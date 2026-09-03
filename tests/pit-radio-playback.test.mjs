import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { tracksForStation, nextStationTrack, nextSequentialTrack, trackSwitchMode } from "../src/data/pit-radio-playback.js";

const source = JSON.parse(readFileSync(new URL("../src/data/netease-playlist.json", import.meta.url)));
const tracks = source.tracks.filter((track) => track.playable);

test("empty station has no preselected song or next song", () => {
  assert.deepEqual(tracksForStation(tracks, null), []);
  assert.equal(nextStationTrack(tracks, null, 1), null);
});

test("all station queues preserve source order and never cross CP boundaries", () => {
  for (const cpId of new Set(tracks.map((track) => track.cpId))) {
    const queue = tracksForStation(tracks, cpId);
    assert.deepEqual(queue, tracks.filter((track) => track.cpId === cpId));
    if (queue.length === 1) {
      assert.equal(nextStationTrack(tracks, queue[0], 1), null);
      continue;
    }
    assert.equal(nextStationTrack(tracks, queue.at(-1), 1).id, queue[0].id);
    assert.equal(nextStationTrack(tracks, queue[0], -1).id, queue.at(-1).id);
    for (const track of queue) assert.equal(nextStationTrack(tracks, track, 1).cpId, cpId);
  }
});

test("same CP keeps the needle and playing or paused state", () => {
  const queue = tracksForStation(tracks, "emibonnie");
  assert.equal(queue.length, 3);
  assert.deepEqual(trackSwitchMode(queue[0], queue[1], true, false), { keepNeedle: true, resume: true });
  assert.deepEqual(trackSwitchMode(queue[0], queue[1], true, true), { keepNeedle: true, resume: false });
  assert.deepEqual(trackSwitchMode(queue[0], queue[1], false, true), { keepNeedle: false, resume: false });
});

test("sequential playback advances only within the current CP and stops at its last song", () => {
  for (const cpId of new Set(tracks.map((track) => track.cpId))) {
    const queue = tracksForStation(tracks, cpId);
    for (let index = 0; index < queue.length - 1; index += 1) {
      assert.equal(nextSequentialTrack(tracks, queue[index]).id, queue[index + 1].id);
    }
    assert.equal(nextSequentialTrack(tracks, queue.at(-1)), null);
  }
});

test("sequential playback does not start from an empty or unknown selection", () => {
  assert.equal(nextSequentialTrack(tracks, null), null);
  assert.equal(nextSequentialTrack(tracks, { id: "missing", cpId: "emibonnie" }), null);
});

test("first selection and a different CP always wait for an explicit play gesture", () => {
  const current = tracks[0];
  const different = tracks.find((track) => track.cpId !== current.cpId);
  assert.deepEqual(trackSwitchMode(null, current, false, true), { keepNeedle: false, resume: false });
  assert.deepEqual(trackSwitchMode(current, different, true, false), { keepNeedle: false, resume: false });
});
