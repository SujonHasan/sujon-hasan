import { cn } from "@/lib/utils";
import { MONOGRAM, SIGNATURE } from "@/components/shared/logo-paths";

interface SignatureProps {
  className?: string;
  /** Wipe the signature in from left to right, like it is being written. */
  animate?: boolean;
}

/**
 * Handwritten "Sujon Hasan" wordmark. Drawn in currentColor so it follows the
 * surrounding text colour in both themes. The thin stroke on top of the fill
 * keeps the hairlines of the script visible at navbar size.
 */
export function Signature({ className, animate = false }: SignatureProps) {
  return (
    <svg
      viewBox={`-2 -2 ${SIGNATURE.width + 4} ${SIGNATURE.height + 4}`}
      role="img"
      aria-label="Sujon Hasan"
      className={cn("h-10 w-auto overflow-visible", animate && "signature-draw", className)}
    >
      <path
        d={SIGNATURE.d}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

const MONOGRAM_SCALE = Math.min((64 * 0.72) / MONOGRAM.width, (64 * 0.72) / MONOGRAM.height);
const MONOGRAM_X = (64 - MONOGRAM.width * MONOGRAM_SCALE) / 2;
const MONOGRAM_Y = (64 - MONOGRAM.height * MONOGRAM_SCALE) / 2;

/**
 * Square "S" monogram for tight spots (admin sidebar, login). Same artwork as
 * the favicon in src/app, but it inverts with the theme instead of staying dark.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-9 w-9 shrink-0 overflow-hidden rounded-[22%] bg-foreground text-background",
        className
      )}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full">
        <path
          transform={`translate(${MONOGRAM_X} ${MONOGRAM_Y}) scale(${MONOGRAM_SCALE})`}
          d={MONOGRAM.d}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={1.5 / MONOGRAM_SCALE}
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
