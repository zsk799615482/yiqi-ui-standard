import { attachTopDockMotion } from "./top-dock-motion.js";
import { attachTopDockScroll } from "./top-dock-scroll.js";
import "./top-dock.css";
import { createTopDockGlass } from "./top-dock-glass.js";

const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};

export function createTopDock({
  logoSrc,
  logoAlt,
  homeHref,
  items,
  theme,
  contentWidth,
  scrollBehavior = "smart",
  glass = true,
}) {
  const header = node("header", "top-dock");
  header.dataset.scrollBehavior = scrollBehavior;
  if (theme) header.dataset.theme = theme;
  if (contentWidth) header.style.setProperty("--top-dock-content-width", contentWidth);
  const bar = node("div", "top-dock__bar");
  const surface = glass ? createTopDockGlass() : null;
  const panelSurface = glass ? createTopDockGlass() : null;
  if (surface) {
    header.dataset.glassSource = "native";
    bar.append(surface);
  }
  const inner = node("div", "top-dock__inner");
  const brand = node("a", "top-dock__brand");
  brand.href = homeHref;
  brand.setAttribute("aria-label", logoAlt);
  const logo = node("img");
  logo.src = logoSrc;
  logo.alt = logoAlt;
  brand.append(logo);

  const nav = node("nav", "top-dock__menu");
  nav.setAttribute("aria-label", "主导航");
  const list = node("ul", "top-dock__list");
  const viewport = node("div", "top-dock__viewport");
  viewport.id = `top-dock-panel-${crypto.randomUUID()}`;
  viewport.hidden = true;
  viewport.dataset.state = "closed";
  let active = null;
  let openedByHover = false;
  const triggers = [];
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  function close() {
    active = null;
    openedByHover = false;
    for (const trigger of triggers) trigger.setAttribute("aria-expanded", "false");
    viewport.dataset.state = "closed";
    viewport.hidden = true;
  }

  function open(trigger, panel) {
    active = trigger;
    for (const entry of triggers) entry.setAttribute("aria-expanded", String(entry === trigger));
    viewport.replaceChildren(...(panelSurface ? [panelSurface, panel] : [panel]));
    viewport.hidden = false;
    viewport.dataset.state = "open";
  }

  for (const item of items) {
    const li = node("li", "top-dock__item");
    if (item.groups?.length) {
      const button = node("button", "top-dock__trigger", item.label);
      button.type = "button";
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-controls", viewport.id);
      const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      arrow.classList.add("top-dock__chevron");
      arrow.setAttribute("viewBox", "0 0 24 24");
      arrow.setAttribute("aria-hidden", "true");
      arrow.innerHTML = '<path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2"/>';
      button.append(arrow);
      const panel = node("div", "top-dock__panel");
      const panelInner = node("div", "top-dock__panel-inner");
      for (const group of item.groups) {
        const section = node("section");
        section.append(node("h2", "top-dock__group-title", group.title));
        const links = node("div", "top-dock__group-links");
        for (const link of group.links) {
          const anchor = node("a", "", link.label);
          anchor.href = link.href;
          links.append(anchor);
        }
        section.append(links);
        panelInner.append(section);
      }
      panel.append(panelInner);
      button.addEventListener("click", () => {
        if (active === button && !openedByHover) close();
        else open(button, panel);
        openedByHover = false;
      });
      button.addEventListener("pointerenter", () => {
        if (finePointer.matches && active !== button) {
          open(button, panel);
          openedByHover = true;
        }
      });
      button.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          open(button, panel);
          openedByHover = false;
          viewport.querySelector("a")?.focus();
        }
      });
      triggers.push(button);
      li.append(button);
    } else if (item.href) {
      const link = node("a", "top-dock__link", item.label);
      link.href = item.href;
      li.append(link);
    }
    list.append(li);
  }
  nav.append(list);
  inner.append(brand, nav);
  bar.append(inner);
  header.append(bar, viewport);

  const onDocumentPointer = (event) => {
    if (!header.contains(event.target)) close();
  };
  const onKey = (event) => {
    if (event.key === "Escape" && active) {
      const restore = active;
      close();
      restore.focus();
    }
    if (!["ArrowLeft", "ArrowRight"].includes(event.key) || !triggers.includes(document.activeElement)) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const current = triggers.indexOf(document.activeElement);
    triggers[(current + direction + triggers.length) % triggers.length].focus();
  };
  const onFocusOut = (event) => {
    if (!header.contains(event.relatedTarget)) close();
  };
  const onPointerLeave = () => {
    if (finePointer.matches && !viewport.contains(document.activeElement)) close();
  };
  const onLinkClick = (event) => {
    const link = event.target.closest?.("a");
    if (!link || !header.contains(link)) return;
    // Avoid leaving focus on a now-hidden same-page navigation link.
    if (viewport.contains(document.activeElement)) active?.focus({ preventScroll: true });
    close();
  };
  document.addEventListener("pointerdown", onDocumentPointer);
  header.addEventListener("keydown", onKey);
  header.addEventListener("focusout", onFocusOut);
  header.addEventListener("pointerleave", onPointerLeave);
  header.addEventListener("click", onLinkClick);
  const detachMotion = attachTopDockMotion(viewport);
  const detachScroll = attachTopDockScroll(header, scrollBehavior);
  return {
    element: header,
    setTheme(next) {
      header.dataset.theme = next;
    },
    destroy() {
      detachMotion();
      detachScroll();
      document.removeEventListener("pointerdown", onDocumentPointer);
      header.removeEventListener("keydown", onKey);
      header.removeEventListener("focusout", onFocusOut);
      header.removeEventListener("pointerleave", onPointerLeave);
      header.removeEventListener("click", onLinkClick);
      header.remove();
    },
  };
}
