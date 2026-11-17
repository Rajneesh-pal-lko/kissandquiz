"use client";

// Bottom call-to-action bar for phones. Appears once the main CTA (element `watch`)
// has scrolled out of view above the screen. Hidden on wider screens via CSS.
import Link from "next/link";
import { useEffect, useState } from "react";

export default function StickyCta({ href, label, watch }: { href: string; label: string; watch: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById(watch);
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => {
      setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    document.body.classList.add("has-sticky");
    return () => {
      io.disconnect();
      document.body.classList.remove("has-sticky");
    };
  }, [watch]);

  return (
    <div className={show ? "sticky-cta show" : "sticky-cta"} aria-hidden={!show}>
      <Link href={href} className="btn" tabIndex={show ? 0 : -1}>
        {label}
      </Link>
    </div>
  );
}
