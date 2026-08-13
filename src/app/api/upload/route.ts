import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-guard";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

export const runtime = "nodejs";

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const IMAGE_RULE = {
  types: IMAGE_TYPES,
  label: "JPEG, PNG, WebP, GIF",
  maxSize: 4 * 1024 * 1024,
};

/**
 * Accepted types are per folder rather than global, so the resume slot cannot
 * be used to smuggle a PDF into an image field — or the reverse.
 */
const FOLDER_RULES: Record<string, typeof IMAGE_RULE> = {
  projects: IMAGE_RULE,
  profile: IMAGE_RULE,
  certifications: IMAGE_RULE,
  seo: IMAGE_RULE,
  resume: {
    types: { "application/pdf": "pdf" },
    label: "PDF",
    maxSize: 8 * 1024 * 1024,
  },
};

const DEFAULT_FOLDER = "projects";

export async function POST(req: NextRequest) {
  return withAuth(req, async (request, userId) => {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const rawFolder = (formData.get("folder") as string) || DEFAULT_FOLDER;

      // Prevent path traversal - only allow whitelisted folder names
      const folder = rawFolder in FOLDER_RULES ? rawFolder : DEFAULT_FOLDER;
      const rule = FOLDER_RULES[folder];

      if (!file) {
        return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
      }

      if (!rule.types[file.type]) {
        return NextResponse.json(
          { success: false, error: `Invalid file type. Allowed: ${rule.label}` },
          { status: 400 }
        );
      }

      if (file.size > rule.maxSize) {
        return NextResponse.json(
          { success: false, error: `File too large. Maximum ${rule.maxSize / (1024 * 1024)}MB` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Get extension from MIME type, not from user filename
      const ext = rule.types[file.type];
      const filename = `${crypto.randomUUID()}.${ext}`;
      const connection = await connectDB();
      const bucket = new mongoose.mongo.GridFSBucket(connection.connection.db!, {
        bucketName: "assets",
      });

      const uploadedId = await new Promise<string>((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(filename, {
          metadata: {
            ownerUserId: userId,
            folder,
            originalName: file.name,
            contentType: file.type,
            size: file.size,
            createdAt: new Date(),
          },
        });

        uploadStream.on("error", reject);
        uploadStream.on("finish", () => resolve(uploadStream.id.toString()));
        uploadStream.end(buffer);
      });

      const url = `/api/assets/${uploadedId}`;
      return NextResponse.json({ success: true, data: { url } });
    } catch {
      return NextResponse.json({ success: false, error: "Failed to upload file" }, { status: 500 });
    }
  });
}
