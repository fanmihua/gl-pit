// One seed per run: resizing, scrubbing or resuming must not change a live path.
function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function createMobileFallingMotion(orbits, seed) {
  if (!orbits) return [];
  const random = seededRandom(seed);
  const between = (min, max) => min + random() * (max - min);
  const width = orbits.width;
  const endX = orbits.portal.left + orbits.portal.width * 0.5;
  const endY = orbits.portal.top + orbits.portal.height * 0.61;

  return orbits.cards.map((card) => {
    const startX = card.left + card.width * 0.5;
    const startY = card.top + card.height * 0.5;
    const distanceY = endY - startY;
    // Keep the control points within a safe horizontal envelope. The starting
    // layout is unchanged; the cards then shrink as their curves bend inward.
    const left = Math.min(startX, endX, card.width * 0.65 + 12);
    const right = Math.max(startX, endX, width - card.width * 0.65 - 12);
    const clampX = (x) => Math.max(left, Math.min(right, x));
    const control1X = clampX(startX + (endX - startX) * between(0.05, 0.4) + width * between(-0.18, 0.18));
    const control1Y = startY + distanceY * between(0.14, 0.38);
    const control2X = clampX(endX + width * between(-0.25, 0.25));
    const control2Y = startY + distanceY * between(0.62, 0.9);
    const rotation = (Number.parseFloat(card.rotation) || 0) + (random() < 0.5 ? -1 : 1) * between(35, 95);
    const initialSpeed = between(0.35, 0.6);
    return {
      path: `M ${startX} ${startY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${endX} ${endY}`,
      rotation,
      duration: Math.round(between(960, 1120)),
      easing: `cubic-bezier(0.333, ${initialSpeed / 3}, 0.667, ${(1 + initialSpeed) / 3})`,
    };
  });
}
