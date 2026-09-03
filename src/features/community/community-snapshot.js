// Keep recently confirmed public data across route changes, never invented totals.
const maxAge = 5 * 60 * 1000;
const entries = new Map();

export function readCommunitySnapshot(key, now = Date.now()) {
  const entry = entries.get(key);
  return entry && now - entry.updatedAt < maxAge ? entry.value : null;
}

export function rememberCommunitySnapshot(key, value, now = Date.now()) {
  if (entries.get(key)?.value === value) return;
  entries.set(key, { value, updatedAt: now });
}
