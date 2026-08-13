"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, label, summary, [data-cursor="hover"]';

const POINTER_FINE = "(pointer: fine)";

/**
 * Subscribes to the pointer-type media query. `useSyncExternalStore` is the
 * right primitive here — reading it in an effect and calling setState would
 * render once with the wrong value and again to correct it.
 */
function usePointerFine() {
  const subscribe = useCallback((onChange: () => void) => {
    const query = window.matchMedia(POINTER_FINE);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(POINTER_FINE).matches,
    () => false // No pointer assumptions during SSR.
  );
}

/**
 * A single circle that replaces the pointer, inverting whatever it passes
 * over via `mix-blend-mode: difference`. One element, no dot, and legible on
 * any background — light, dark, or photography — without needing to know what
 * is underneath.
 *
 * Only mounts for real mouse users — touch and reduced-motion visitors keep
 * the platform cursor untouched.
 */
export function CursorFollower() {
  const reduceMotion = useReducedMotion();
  const pointerFine = usePointerFine();
  const enabled = pointerFine && !reduceMotion;

  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  // Just enough lag to feel fluid without lagging behind the intent.
  const smoothX = useSpring(x, { stiffness: 700, damping: 42, mass: 0.4 });
  const smoothY = useSpring(y, { stiffness: 700, damping: 42, mass: 0.4 });

  useEffect(() => {
    if (!enabled) return;

    const handleMove = (event: MouseEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
      const target = event.target as Element | null;
      setHovering(Boolean(target?.closest?.(INTERACTIVE_SELECTOR)));
    };

    const handleLeave = () => setVisible(false);
    const handleDown = () => setPressed(true);
    const handleUp = () => setPressed(false);

    window.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave);
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [enabled, x, y]);

  // Hide the native cursor only once the follower is actually running, so a
  // failed mount never leaves the page without any cursor at all.
  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-custom-cursor");
    return () => document.documentElement.classList.remove("has-custom-cursor");
  }, [enabled]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      // White + difference inverts the backdrop, so the circle reads on every
      // surface. Blending needs a plain background colour, not a theme token.
      className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full bg-white mix-blend-difference"
      style={{ x: smoothX, y: smoothY, translateX: "-50%", translateY: "-50%" }}
      animate={{
        opacity: visible ? 1 : 0,
        width: hovering ? 52 : 20,
        height: hovering ? 52 : 20,
        scale: pressed ? 0.8 : 1,
      }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}
