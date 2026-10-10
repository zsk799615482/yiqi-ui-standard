import { animate, motionValue } from "motion";

// The menu primitive owns presence and focus; this only enhances its viewport.
export function attachTopDockMotion(target) {
  if (!target) return () => {};
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let playback;
  let keyboardInput = false;
  let previousKey = "";
  const offset = motionValue(-8);
  const getViewport = () => target.matches(".top-dock__viewport")
    ? target : target.querySelector(".top-dock__viewport");
  const unsubscribe = offset.on("change", (value) => {
    const viewport = getViewport();
    if (viewport) viewport.style.transform = `translateY(${value}px)`;
  });
  const root = target.closest(".top-dock") || target;
  const onKeyboard = () => { keyboardInput = true; };
  const onPointer = () => { keyboardInput = false; };
  root.addEventListener("keydown", onKeyboard, true);
  root.addEventListener("pointerdown", onPointer, true);
  root.addEventListener("pointermove", onPointer, true);
  const enter = () => {
    const viewport = getViewport();
    if (!viewport) {
      previousKey = "";
      playback?.stop();
      return;
    }
    const key = `${viewport.dataset.state}|${viewport.textContent}`;
    if (key === previousKey) return;
    const previousWasOpen = previousKey.startsWith("open|");
    previousKey = key;
    if (preference.matches || keyboardInput || viewport.dataset.state !== "open") {
      playback?.stop();
      offset.jump(0);
      viewport.style.transform = "";
      return;
    }
    if (!previousWasOpen) offset.jump(-8);
    // Retarget a MotionValue, not fresh keyframes: in-flight velocity survives.
    playback = animate(offset, 0, { type: "spring", stiffness: 520, damping: 42 });
  };
  const observer = new MutationObserver(enter);
  observer.observe(target, {
    attributes: true, attributeFilter: ["data-state"], childList: true, subtree: true,
  });
  const onPreference = () => {
    playback?.stop();
    offset.jump(0);
    const viewport = getViewport();
    if (viewport) viewport.style.transform = "";
  };
  preference.addEventListener("change", onPreference);
  enter();
  return () => {
    observer.disconnect();
    playback?.stop();
    unsubscribe();
    preference.removeEventListener("change", onPreference);
    root.removeEventListener("keydown", onKeyboard, true);
    root.removeEventListener("pointerdown", onPointer, true);
    root.removeEventListener("pointermove", onPointer, true);
    onPreference();
  };
}
