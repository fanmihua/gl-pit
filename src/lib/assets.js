export function withBase(assetPath) {
  if (!assetPath) return "";
  if (/^https?:\/\//.test(assetPath)) return assetPath;
  return `${import.meta.env.BASE_URL}${assetPath.replace(/^\//, "")}`;
}
