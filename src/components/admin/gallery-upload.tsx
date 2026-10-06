"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/admin/image-upload";
import { SafeImage } from "@/components/shared/safe-image";

interface GalleryUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
}

/**
 * Ordered list of screenshots for the project detail page. Reuses the single
 * ImageUpload as an "add" slot, so upload rules stay in one place.
 */
export function GalleryUpload({ value, onChange, folder = "projects" }: GalleryUploadProps) {
  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((url, index) => (
            <div key={`${url}-${index}`} className="relative">
              <SafeImage
                src={url}
                alt={`Gallery image ${index + 1}`}
                width={160}
                height={100}
                className="h-[100px] w-[160px] rounded-lg border object-cover"
                fallback={
                  <div className="flex h-[100px] w-[160px] items-center justify-center rounded-lg border bg-muted text-center text-xs text-muted-foreground">
                    Image unavailable
                  </div>
                }
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 h-6 w-6"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <ImageUpload value="" folder={folder} onChange={(url) => url && onChange([...value, url])} />
    </div>
  );
}
