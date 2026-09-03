export const FALLING_DURATION_MS = 1200;

export function getHomePreviewScene(search, isDevelopment) {
  if (!isDevelopment) return null;
  return new URLSearchParams(search).get("previewScene") === "welcome" ? "welcome" : null;
}
