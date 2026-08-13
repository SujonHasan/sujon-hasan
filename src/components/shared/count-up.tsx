"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface CountUpProps {
  /** Raw label such as "3+", "20+", "750+" — non-digits are preserved. */
  value: string;
  duration?: number;
  className?: string;
}

/**
 * Animates the numeric part of a stat while keeping any prefix/suffix
 * ("+", "%", "k") intact. Values without digits render unchanged.
 */
export function CountUp({ value, duration = 1600, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();

  const match = value.match(/(\d[\d,]*)/);
  const target = match ? Number(match[1].replace(/,/g, "")) : null;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView || target === null || reduceMotion) return;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutExpo keeps the number lively at the start and settles softly.
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCurrent(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target, duration, reduceMotion]);

  if (target === null) {
    return (
      <span ref={ref} className={className}>
        {value}
      </span>
    );
  }

  const shown = reduceMotion || !inView ? target : current;

  return (
    <span ref={ref} className={className}>
      {value.replace(/\d[\d,]*/, shown.toLocaleString())}
    </span>
  );
}
