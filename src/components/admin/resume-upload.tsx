"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";

interface ResumeUploadProps {
  value: string;
  onChange: (url: string) => void;
}

const MAX_SIZE = 8 * 1024 * 1024;

/**
 * Upload slot for a hand-made resume PDF. Whatever lands in `value` takes
 * precedence over the generated template on the public download button.
 */
export function ResumeUpload({ value, onChange }: ResumeUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({ title: "Error", description: "Resume must be a PDF", variant: "destructive" });
      return;
    }

    if (file.size > MAX_SIZE) {
      toast({ title: "Error", description: "File size must be less than 8MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "resume");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        onChange(data.data.url);
        toast({ title: "Success", description: "Resume uploaded. Remember to save." });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
      // Allow re-picking the same file after a removal.
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <FileText className="h-8 w-8 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Resume attached</p>
            <p className="truncate text-xs text-muted-foreground">{value}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" asChild>
            <a href={value} target="_blank" rel="noopener noreferrer">
              View
            </a>
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onChange("")}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove resume</span>
          </Button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary/50"
        >
          {isUploading ? (
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload your resume</p>
              <p className="mt-1 text-xs text-muted-foreground">PDF only, max 8MB</p>
            </>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
