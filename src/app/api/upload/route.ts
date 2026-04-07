import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-guard";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

export const runtime = "nodejs";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const ALLOWED_FOLDERS = ["projects", "profile", "certifications", "seo"];
const MAX_SIZE = 4 * 1024 * 1024; // 4MB

export async function POST(req: NextRequest) {
  return withAuth(req, async (request, userId) => {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const rawFolder = (formData.get("folder") as string) || "projects";

      // Prevent path traversal - only allow whitelisted folder names
      const folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : "projects";

      if (!file) {
        return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
      }

      if (!ALLOWED_TYPES[file.type]) {
        return NextResponse.json(
          { success: false, error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
          { status: 400 }
        );
      }

      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { success: false, error: "File too large. Maximum 4MB" },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Get extension from MIME type, not from user filename
      const ext = ALLOWED_TYPES[file.type];
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
