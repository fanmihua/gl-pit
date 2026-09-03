export function tracksForStation(tracks, cpId) {
  return cpId ? tracks.filter((track) => track.cpId === cpId) : [];
}

export function nextStationTrack(tracks, current, offset) {
  if (!current) return null;
  const queue = tracksForStation(tracks, current.cpId);
  const index = queue.findIndex((track) => track.id === current.id);
  if (index < 0 || queue.length < 2) return null;
  return queue[((index + offset) % queue.length + queue.length) % queue.length];
}

export function nextSequentialTrack(tracks, current) {
  if (!current) return null;
  const queue = tracksForStation(tracks, current.cpId);
  const index = queue.findIndex((track) => track.id === current.id);
  return index < 0 ? null : queue[index + 1] ?? null;
}

export function trackSwitchMode(current, next, needleDown, paused) {
  const keepNeedle = Boolean(current && current.cpId === next.cpId && needleDown);
  return { keepNeedle, resume: keepNeedle && !paused };
}
