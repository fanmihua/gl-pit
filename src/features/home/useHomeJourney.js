import { useCallback, useEffect, useRef, useState } from "react";
import { FALLING_DURATION_MS, getHomePreviewScene } from "./home-journey-timing.js";

export function useHomeJourney() {
  const lastAdvanceRef = useRef(0);
  const [scene, setScene] = useState(() => getHomePreviewScene(window.location.search, import.meta.env.DEV) ?? "cover");
  const [fallingSeed, setFallingSeed] = useState(() => Math.floor(Math.random() * 4294967296));
  const rerollFalling = useCallback(() => setFallingSeed(Math.floor(Math.random() * 4294967296)), []);

  const advanceJourney = useCallback(() => {
    const now = Date.now();
    if (now - lastAdvanceRef.current < 650) return;
    lastAdvanceRef.current = now;
    setScene((current) => {
      if (current === "cover") return "eyes";
      if (current === "eyes") return "falling";
      if (current === "falling") return "welcome";
      return current;
    });
  }, []);

  useEffect(() => {
    if (!['eyes', 'falling'].includes(scene)) return undefined;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduceMotion ? 500 : scene === "eyes" ? 2300 : FALLING_DURATION_MS;
    const timer = window.setTimeout(() => {
      lastAdvanceRef.current = 0;
      setScene(scene === "eyes" ? "falling" : "welcome");
    }, delay);
    return () => window.clearTimeout(timer);
  }, [scene]);

  const restartJourney = () => {
    rerollFalling();
    lastAdvanceRef.current = 0;
    setScene("cover");
  };
  return { scene, fallingSeed, advanceJourney, restartJourney };
}
