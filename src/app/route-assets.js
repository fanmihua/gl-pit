// Test visibility in the laid-out page, not the loading overlay's opacity.
export function isFirstScreenImage(image, viewport, getStyle) {
  if (!image.getClientRects().length) return false;
  const style = getStyle(image);
  if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false;
  const rect = image.getBoundingClientRect();
  // An image without intrinsic dimensions may have zero height until it loads.
  return rect.width > 0 && rect.right > 0 && rect.left < viewport.width
    && rect.bottom >= 0 && rect.top < viewport.height;
}

export function firstScreenImages(root, viewport, getStyle) {
  const images = [...root.querySelectorAll('img[data-page-critical="true"]')]
    .filter((image) => isFirstScreenImage(image, viewport, getStyle));
  return [...new Map(images.map((image) => [image.currentSrc || image.src, image])).values()];
}
