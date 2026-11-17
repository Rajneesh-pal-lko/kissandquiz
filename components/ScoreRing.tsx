"use client";

// Animated score ring: the ring fills and the number counts up.
import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./fx";

export default function ScoreRing({ score, total, children }: { score: number; total: number; children?: React.ReactNode }) {
  const pct = total > 0 ? (score / total) * 100 : 0;
  const [t, setT] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setT(1);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1300;
    const tick = (now: number) => {
      const x = Math.min(1, (now - start) / dur);
      setT(1 - Math.pow(1 - x, 3)); // ease-out cubic
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, total]);

  return (
    <div className="score-wrap">
      <div
        className="score-ring"
        style={{ "--p": (pct * t).toFixed(1) } as React.CSSProperties}
        role="img"
        aria-label={`Score: ${score} out of ${total}`}
      >
        <div className="score-num" aria-hidden="true">
          {Math.round(score * t)}
          <small>out of {total}</small>
        </div>
      </div>
      {children}
    </div>
  );
}
