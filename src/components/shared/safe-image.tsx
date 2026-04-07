"use client";

import { ReactNode, useState } from "react";
import Image, { ImageProps } from "next/image";

interface SafeImageProps extends ImageProps {
  fallback?: ReactNode;
}

export function SafeImage({ src, alt, fallback = null, ...props }: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const currentSrc = src ? String(src) : "";

  if (!src || failedSrc === currentSrc) {
    return <>{fallback}</>;
  }

  return <Image {...props} src={src} alt={alt} onError={() => setFailedSrc(currentSrc)} />;
}
