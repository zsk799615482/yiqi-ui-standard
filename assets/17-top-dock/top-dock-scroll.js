import { animate, motionValue } from "motion";
import { createTopDockScrollTracker } from "./top-dock-scroll-state.js";

// CSS owns sticky/static placement; this controller only translates the header.
export function attachTopDockScroll(header, behavior = "smart") {
  if (!header || typeof window === "undefined") return () => {};
  const originalTransform = header.style.transform;
  const originalState = header.getAttribute("data-scroll-state");
  const restore = () => {
    header.style.transform = originalTransform;
    if (originalState === null) header.removeAttribute("data-scroll-state");
    else header.setAttribute("data-scroll-state", originalState);
  };
  header.dataset.scrollState = "visible";
  if (behavior !== "smart") return restore;

  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const tracker = createTopDockScrollTracker();
  const offset = motionValue(0);
  let height = Math.max(1, header.offsetHeight);
  let playback;
  let frame = null;
  let disposed = false;
  let hovered = finePointer.matches && header.matches(":hover");
  let visible = true;
  let target = 0;

  const renderOffset = (value) => {
    header.style.transform = `translateY(${value}px)`;
  };
  const unsubscribe = offset.on("change", renderOffset);
  const scrollY = () => Math.max(0, Math.min(
    window.scrollY,
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
  ));
  const isBusy = () =>
    (finePointer.matches && hovered) ||
    header.contains(document.activeElement) ||
    Boolean(header.querySelector('[aria-expanded="true"], [data-state="open"]'));

  const setVisibility = (next, immediate = false) => {
    const nextTarget = next ? 0 : -height;
    if (visible === next && target === nextTarget && !immediate) return;
    visible = next;
    target = nextTarget;
    header.dataset.scrollState = next ? "visible" : "hidden";
    if (immediate || preference.matches) {
      playback?.stop();
      offset.jump(target);
      renderOffset(target);
    } else {
      // Retarget the same MotionValue so a direction reversal keeps velocity.
      playback = animate(offset, target, {
        type: "spring", stiffness: 520, damping: 42,
      });
    }
  };
  const update = () => {
    frame = null;
    if (disposed) return;
    const busy = isBusy();
    setVisibility(tracker.update(scrollY(), busy), busy);
  };
  const schedule = () => {
    if (!disposed && frame === null) frame = requestAnimationFrame(update);
  };
  const onPointerEnter = (event) => {
    hovered = event.pointerType !== "touch" && finePointer.matches;
    if (hovered) schedule();
  };
  const onPointerLeave = () => { hovered = false; };
  const onFocusIn = () => {
    // Keyboard focus must not sit on a partially hidden, animated control.
    tracker.update(scrollY(), true);
    setVisibility(true, true);
  };
  const onPreference = () => setVisibility(visible, true);
  const resizeObserver = new ResizeObserver(() => {
    const nextHeight = Math.max(1, header.offsetHeight);
    if (nextHeight !== height) {
      height = nextHeight;
      setVisibility(visible);
    }
  });
  const menuObserver = new MutationObserver(schedule);

  tracker.update(scrollY());
  renderOffset(0);
  resizeObserver.observe(header);
  menuObserver.observe(header, {
    attributes: true,
    attributeFilter: ["aria-expanded", "data-state"],
    childList: true,
    subtree: true,
  });
  window.addEventListener("scroll", schedule, { passive: true });
  header.addEventListener("pointerenter", onPointerEnter);
  header.addEventListener("pointerleave", onPointerLeave);
  header.addEventListener("focusin", onFocusIn);
  header.addEventListener("focusout", schedule);
  preference.addEventListener("change", onPreference);

  return () => {
    disposed = true;
    window.removeEventListener("scroll", schedule);
    header.removeEventListener("pointerenter", onPointerEnter);
    header.removeEventListener("pointerleave", onPointerLeave);
    header.removeEventListener("focusin", onFocusIn);
    header.removeEventListener("focusout", schedule);
    preference.removeEventListener("change", onPreference);
    resizeObserver.disconnect();
    menuObserver.disconnect();
    if (frame !== null) cancelAnimationFrame(frame);
    playback?.stop();
    unsubscribe();
    offset.destroy();
    restore();
  };
}
