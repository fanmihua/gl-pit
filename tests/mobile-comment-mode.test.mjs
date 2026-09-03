import test from "node:test";
import assert from "node:assert/strict";
import { getQuoteCommentsMode } from "../src/features/community/community-state.js";

test("mobile confirmed zero skips the list; unknown is not zero", () => {
  assert.equal(getQuoteCommentsMode({ skipKnownEmpty: true, statsLoaded: true, commentCount: 0 }), "empty");
  assert.equal(getQuoteCommentsMode({ skipKnownEmpty: true, statsLoaded: false, commentCount: 0 }), "list");
  for (const commentCount of [undefined, null, NaN, 1, 50]) {
    assert.equal(getQuoteCommentsMode({ skipKnownEmpty: true, statsLoaded: true, commentCount }), "list");
  }
});

test("desktop keeps the existing load behavior", () => {
  assert.equal(getQuoteCommentsMode({ statsLoaded: true, commentCount: 0 }), "list");
});
