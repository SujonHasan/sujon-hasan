"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface TextRotatorProps {
  items: string[];
  interval?: number;
  className?: string;
}

/** Cycles through a list of roles/skills with a soft vertical swap. */
export function TextRotator({ items, interval = 2600, className }: TextRotatorProps) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (items.length < 2 || reduceMotion) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, interval);
    return () => clearInterval(id);
  }, [items.length, interval, reduceMotion]);

  if (items.length === 0) return null;

  return (
    <span className={`relative inline-flex overflow-hidden align-bottom ${className || ""}`}>
      {/* Invisible longest item reserves the width so the line never jumps. */}
      <span className="invisible whitespace-nowrap" aria-hidden>
        {items.reduce((a, b) => (b.length > a.length ? b : a), "")}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={items[index]}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 whitespace-nowrap text-primary font-semibold"
        >
          {items[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
