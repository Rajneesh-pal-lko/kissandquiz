// Tiny, dependency-free celebration effects: heart burst, "+1" and heart confetti.
// Everything is skipped when the visitor prefers reduced motion.

const HEARTS = ["1f496", "1f495", "2728", "1f49e"];
const COLORS = ["#ff4f8b", "#ffc94d", "#b9a3ff", "#5fd3a5", "#ff8a5b", "#e8336f"];

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function layer(ttl: number): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "fx-layer";
  el.setAttribute("aria-hidden", "true");
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), ttl);
  return el;
}

function heartImg(code: string): HTMLImageElement {
  const img = document.createElement("img");
  img.src = `/emoji/3d/${code}.webp`;
  img.alt = "";
  img.width = 26;
  img.height = 26;
  return img;
}

/** Small hearts bursting out of an element, plus an optional "+1". */
export function heartBurst(target: Element | null, plus?: string) {
  if (!target || prefersReducedMotion()) return;
  const r = target.getBoundingClientRect();
  const cx = r.left + r.width * 0.82;
  const cy = r.top + r.height / 2;
  const fx = layer(1100);
  const n = 9;
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
    const dist = 46 + Math.random() * 46;
    const img = heartImg(HEARTS[i % HEARTS.length]);
    img.className = "fx-heart";
    img.style.left = `${cx}px`;
    img.style.top = `${cy}px`;
    img.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
    img.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
    img.style.setProperty("--rot", `${Math.round(Math.random() * 60 - 30)}deg`);
    fx.appendChild(img);
  }
  if (plus) {
    const s = document.createElement("span");
    s.className = "fx-plus";
    s.textContent = plus;
    s.style.left = `${cx}px`;
    s.style.top = `${r.top - 4}px`;
    fx.appendChild(s);
  }
}

/** Hearts and paper confetti falling from the top of the screen. */
export function confetti(count = 70) {
  if (typeof document === "undefined" || prefersReducedMotion()) return;
  const fx = layer(4200);
  const w = window.innerWidth;
  for (let i = 0; i < count; i++) {
    const isHeart = i % 4 === 0;
    const el: HTMLElement = isHeart ? heartImg(HEARTS[i % HEARTS.length]) : document.createElement("span");
    el.className = isHeart ? "fx-confetti" : "fx-confetti rect";
    if (!isHeart) el.style.background = COLORS[i % COLORS.length];
    const size = isHeart ? 18 + Math.random() * 12 : 0;
    if (isHeart) {
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
    }
    el.style.left = `${Math.random() * w}px`;
    el.style.setProperty("--dx", `${Math.round(Math.random() * 160 - 80)}px`);
    el.style.setProperty("--rot", `${Math.round(360 + Math.random() * 540) * (Math.random() < 0.5 ? -1 : 1)}deg`);
    el.style.setProperty("--d", `${(2 + Math.random() * 1.6).toFixed(2)}s`);
    el.style.setProperty("--delay", `${(Math.random() * 0.45).toFixed(2)}s`);
    fx.appendChild(el);
  }
}
