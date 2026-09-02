import { useLayoutEffect, useRef, useState } from "react";
import { PageLoader } from "./PageLoader.jsx";

const READY_TIMEOUT = 12000;

async function decodeImage(image) {
  if (image.naturalWidth > 0 && typeof image.decode === "function") {
    try {
      await image.decode();
    } catch {
      // A loaded image can still reject decode() in Safari or after a cache race.
    }
  }
}

function waitForImage(image) {
  if (image.complete) return decodeImage(image);

  return new Promise((resolve) => {
    const settle = async () => {
      await decodeImage(image);
      resolve();
    };

    image.addEventListener("load", settle, { once: true });
    image.addEventListener("error", settle, { once: true });
  });
}

export function RouteReadyBoundary({ routeKey, kicker, label, children }) {
  const contentRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  useLayoutEffect(() => {
    let cancelled = false;
    let revealFrame = 0;
    let scanFrame = 0;
    let timeout = 0;

    setReady(false);
    setProgress(0);

    const reveal = () => {
      if (cancelled) return;
      setProgress(100);
      revealFrame = window.requestAnimationFrame(() => {
        if (!cancelled) setReady(true);
      });
    };

    scanFrame = window.requestAnimationFrame(() => {
      const images = Array.from(contentRef.current?.querySelectorAll('img[data-page-critical="true"]') ?? []);
      const uniqueImages = Array.from(new Map(
        images.map((image) => [image.currentSrc || image.src, image]),
      ).values());

      if (uniqueImages.length === 0) {
        reveal();
        return;
      }

      let settledCount = 0;
      timeout = window.setTimeout(reveal, READY_TIMEOUT);

      Promise.allSettled(uniqueImages.map((image) => waitForImage(image).finally(() => {
        settledCount += 1;
        if (!cancelled) setProgress((settledCount / uniqueImages.length) * 100);
      }))).then(() => {
        window.clearTimeout(timeout);
        reveal();
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(scanFrame);
      window.cancelAnimationFrame(revealFrame);
      window.clearTimeout(timeout);
    };
  }, [routeKey]);

  return (
    <div className={`route-ready-boundary${ready ? " is-ready" : " is-loading"}`}>
      <div className="route-ready-content" ref={contentRef}>{children}</div>
      {!ready && (
        <PageLoader
          className="route-ready-loader"
          kicker={kicker}
          label={label}
          progress={progress}
        />
      )}
    </div>
  );
}
