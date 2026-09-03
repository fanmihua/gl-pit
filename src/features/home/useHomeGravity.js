export function useHomeGravity(heroRef, scene) {
  const updateGravity = (event) => {
    const hero = heroRef.current;
    if (!hero || scene !== "cover") return;

    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const pitX = 0.5;
    const pitY = 0.73;
    const distance = Math.hypot(x - pitX, y - pitY);
    const gravity = Math.max(0, Math.min(1, 1 - distance / 0.42));

    hero.style.setProperty("--pointer-x", (x * 2 - 1).toFixed(3));
    hero.style.setProperty("--pointer-y", (y * 2 - 1).toFixed(3));
    hero.style.setProperty("--gravity", gravity.toFixed(3));
    hero.style.setProperty("--orbit-speed", `${Math.max(1.8, 8 - gravity * 6.2).toFixed(2)}s`);
  };

  const resetGravity = () => {
    const hero = heroRef.current;
    if (!hero || scene !== "cover") return;
    hero.style.setProperty("--pointer-x", "0");
    hero.style.setProperty("--pointer-y", "0");
    hero.style.setProperty("--gravity", "0");
    hero.style.setProperty("--orbit-speed", "8s");
  };

  return { updateGravity, resetGravity };
}
