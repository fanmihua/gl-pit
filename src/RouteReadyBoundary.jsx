import { useLayoutEffect, useRef, useState } from "react";
import { PageLoader } from "./PageLoader.jsx";
import { firstScreenImages } from "./app/route-assets.js";

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

function waitForImage(image, signal) {
  if (image.complete) return decodeImage(image);

  return new Promise((resolve) => {
    const cleanup = () => {
      image.removeEventListener("load", settle);
      image.removeEventListener("error", settle);
      signal.removeEventListener("abort", abort);
    };
    const abort = () => { cleanup(); resolve(); };
    const settle = async () => {
      cleanup();
      await decodeImage(image);
      resolve();
    };

    image.addEventListener("load", settle, { once: true });
    image.addEventListener("error", settle, { once: true });
    signal.addEventListener("abort", abort, { once: true });
  });
}

export function RouteReadyBoundary({ routeKey, kicker, label, navigation, children }) {
  const contentRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  useLayoutEffect(() => {
    let cancelled = false;
    let revealFrame = 0;
    let scanFrame = 0;
    let timeout = 0;
    let revealed = false;
    const controller = new AbortController();
    let observer;

    setReady(false);
    setProgress(0);

    const reveal = () => {
      if (cancelled || revealed) return;
      revealed = true;
      controller.abort();
      setProgress(100);
      revealFrame = window.requestAnimationFrame(() => {
        if (!cancelled) setReady(true);
      });
    };

    const scan = () => {
      const content = contentRef.current;
      if (!content || cancelled) return;
      // The camera has its own asset preparation phase. Keep navigation hidden
      // until that phase has actually rendered the page, too.
      const pendingPage = content.querySelector(".page-loader");
      if (pendingPage) {
        setProgress(Number(pendingPage.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")) || 0);
        return;
      }
      observer?.disconnect();
      const uniqueImages = firstScreenImages(content, {
        width: document.documentElement.clientWidth,
        height: window.innerHeight,
      }, window.getComputedStyle);

      if (uniqueImages.length === 0) {
        reveal();
        return;
      }

      let settledCount = 0;
      timeout = window.setTimeout(reveal, READY_TIMEOUT);

      Promise.allSettled(uniqueImages.map((image) => waitForImage(image, controller.signal).finally(() => {
        settledCount += 1;
        if (!cancelled) setProgress((settledCount / uniqueImages.length) * 100);
      }))).then(() => {
        window.clearTimeout(timeout);
        reveal();
      });
    };
    observer = new MutationObserver(() => {
      window.cancelAnimationFrame(scanFrame);
      scanFrame = window.requestAnimationFrame(scan);
    });
    observer.observe(contentRef.current, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-valuenow"] });
    scanFrame = window.requestAnimationFrame(scan);

    return () => {
      cancelled = true;
      observer.disconnect();
      controller.abort();
      window.cancelAnimationFrame(scanFrame);
      window.cancelAnimationFrame(revealFrame);
      window.clearTimeout(timeout);
    };
  }, [routeKey]);

  return (
    <div className={`route-ready-boundary${ready ? " is-ready" : " is-loading"}`}>
      <div className="route-ready-content" ref={contentRef}>{children}</div>
      {ready && navigation}
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
