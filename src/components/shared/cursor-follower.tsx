"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, label, summary, [data-cursor="hover"]';

const POINTER_FINE = "(pointer: fine)";

/** Rendered size of the rocket in px. */
const SIZE = 32;
/** Growth over interactive elements. */
const HOVER_SCALE = 1.3;
/**
 * Minimum travel, squared, before the heading is recalculated. Without it the
 * rocket spins wildly on sub-pixel jitter.
 */
const MIN_TRAVEL_SQ = 9;

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
 * Replaces the pointer with a small rocket that banks towards whichever way
 * the mouse is travelling, with its exhaust flaring as it goes.
 *
 * Position is written straight from the pointer — nothing eases it, because
 * the rocket stands in for the system cursor and any lag is read against the
 * hand. Only the heading is smoothed, which costs no positional accuracy.
 *
 * Everything animates through transforms on a single element, so no frame
 * does layout or paint work.
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

  // The heading is the one value worth easing: turning instantly looks like
  // the sprite is snapping between frames.
  const heading = useMotionValue(0);
  const smoothHeading = useSpring(heading, { stiffness: 300, damping: 26, mass: 0.5 });

  useEffect(() => {
    if (!enabled) return;

    let lastTarget: Element | null = null;
    let lastX = 0;
    let lastY = 0;
    let seeded = false;
    // Kept unwrapped rather than reduced to 0–360, so the spring turns the
    // short way instead of unwinding through a full rotation at the seam.
    let unwrapped = 0;

    const handleMove = (event: MouseEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);

      if (!seeded) {
        lastX = event.clientX;
        lastY = event.clientY;
        seeded = true;
      } else {
        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;

        if (dx * dx + dy * dy > MIN_TRAVEL_SQ) {
          // The artwork points up (-Y), so add a quarter turn to the angle
          // measured from the +X axis.
          const target = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
          let delta = target - (unwrapped % 360);
          if (delta > 180) delta -= 360;
          else if (delta < -180) delta += 360;

          unwrapped += delta;
          heading.set(unwrapped);
          lastX = event.clientX;
          lastY = event.clientY;
        }
      }

      // `closest()` walks the tree with a nine-branch selector, and most
      // mousemove events land on the element the previous one did. Re-testing
      // only when the target actually changes skips nearly all of that work
      // without costing a frame of latency.
      const target = event.target as Element | null;
      if (target === lastTarget) return;
      lastTarget = target;
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
  }, [enabled, heading, x, y]);

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
      className="pointer-events-none fixed left-0 top-0 z-[9999]"
      style={{ x, y, willChange: "transform" }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.svg
        viewBox="0 0 24 24"
        width={SIZE}
        height={SIZE}
        style={{
          rotate: smoothHeading,
          marginLeft: -SIZE / 2,
          marginTop: -SIZE / 2,
          display: "block",
        }}
        animate={{ scale: (hovering ? HOVER_SCALE : 1) * (pressed ? 0.85 : 1) }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* A stroke in the page background colour, painted behind the fills,
            keeps the rocket readable over photography and over primary-
            coloured buttons — the SVG equivalent of an outline. */}
        <g
          stroke="hsl(var(--background))"
          strokeWidth={1.6}
          strokeLinejoin="round"
          style={{ paintOrder: "stroke fill" }}
        >
          {/* Exhaust */}
          <motion.path
            d="M9.9 17.4h4.2L12 22.6z"
            fill="#f59e0b"
            animate={{ scaleY: hovering ? 1.35 : 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ originX: "12px", originY: "17.4px" }}
          />
          {/* Fins */}
          <path
            d="M8.1 11.6c-1.8 1.3-3 3.2-3.4 5.6l3.4-1.7zM15.9 11.6c1.8 1.3 3 3.2 3.4 5.6l-3.4-1.7z"
            fill="hsl(var(--primary))"
            opacity={0.75}
          />
          {/* Body */}
          <path
            d="M12 1.4c2.9 3.1 4.4 6.9 4.4 10.7 0 1.7-.3 3.3-.9 4.6H8.5c-.6-1.3-.9-2.9-.9-4.6 0-3.8 1.5-7.6 4.4-10.7z"
            fill="hsl(var(--primary))"
          />
          {/* Porthole */}
          <circle cx="12" cy="8.8" r="1.9" fill="hsl(var(--background))" stroke="none" />
        </g>
      </motion.svg>
    </motion.div>
  );
}
