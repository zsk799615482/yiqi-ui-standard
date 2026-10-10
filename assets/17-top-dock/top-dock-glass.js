// Original, framework-free SVG material. No vendor source is redistributed.
let sequence = 0;

export function createTopDockGlass() {
  const surface = document.createElement("div");
  surface.className = "top-dock__glass";
  surface.setAttribute("aria-hidden", "true");
  const id = `top-dock-glass-${++sequence}`;
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.innerHTML = `<defs><filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".008 .016" numOctaves="1" seed="17" result="map"/><feGaussianBlur in="map" stdDeviation="2" result="smooth"/><feDisplacementMap in="SourceGraphic" in2="smooth" scale="8" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".5"/></filter></defs>`;
  surface.append(svg);
  const agent = navigator.userAgent;
  const enhanced = !/Firefox/.test(agent)
    && !(/Safari/.test(agent) && !/Chrome/.test(agent))
    && CSS.supports("backdrop-filter", `url(#${id})`);
  if (enhanced) {
    surface.style.backdropFilter = `url(#${id}) blur(12px) saturate(140%)`;
    surface.dataset.glassTier = "full";
  } else {
    surface.style.backdropFilter = "blur(24px) saturate(140%)";
    surface.dataset.glassTier = "lite";
  }
  return surface;
}
