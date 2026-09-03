import test from "node:test";
import assert from "node:assert/strict";
import { readCommunitySnapshot, rememberCommunitySnapshot } from "../src/features/community/community-snapshot.js";
import { unknownStats, getQuoteCommentsMode } from "../src/features/community/community-state.js";

test("missing data stays unknown instead of becoming a confirmed empty comment list", () => {
  assert.equal(readCommunitySnapshot("missing", 0), null);
  assert.equal(unknownStats.likes, null);
  assert.equal(getQuoteCommentsMode({ skipKnownEmpty: true, statsLoaded: false, commentCount: unknownStats.comments }), "list");
});

test("returning to a route reuses confirmed totals, but not an expired snapshot", () => {
  const totals = { "quote:q-01": { likes: 7, comments: 3 } };
  rememberCommunitySnapshot("test-totals", totals, 1000);
  assert.deepEqual(readCommunitySnapshot("test-totals", 2000), totals);
  // A remount of the same snapshot cannot keep stale data alive indefinitely.
  rememberCommunitySnapshot("test-totals", totals, 200000);
  assert.equal(readCommunitySnapshot("test-totals", 301000), null);
});

test("confirmed reaction changes replace the cached count, including a real zero", () => {
  rememberCommunitySnapshot("test-mutation", { likes: 1 }, 1000);
  rememberCommunitySnapshot("test-mutation", { likes: 0 }, 2000);
  assert.deepEqual(readCommunitySnapshot("test-mutation", 2500), { likes: 0 });
});
