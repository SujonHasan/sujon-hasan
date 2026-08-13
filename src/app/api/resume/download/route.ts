import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { Readable } from "node:stream";
import { connectDB } from "@/lib/db";
import { getLatestAboutLean } from "@/lib/about";
import {
  generateResumePdf,
  getResumeData,
  normalizeResumeTemplate,
} from "@/lib/resume";
import { sanitizeUrl } from "@/lib/sanitize";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

/** Internal uploads are stored in GridFS and addressed as /api/assets/<id>. */
const ASSET_PATH = /^\/api\/assets\/([a-f0-9]{24})$/i;

function disposition(preview: boolean, filename: string) {
  return `${preview ? "inline" : "attachment"}; filename="${filename}"`;
}

/**
 * Streams an uploaded resume out of GridFS. Returns null when the id no
 * longer resolves, so a stale `resumeUrl` falls back to the generated
 * template instead of 404-ing the download button.
 */
async function streamUploadedResume(id: string, filename: string, preview: boolean) {
  const connection = await connectDB();
  const bucket = new mongoose.mongo.GridFSBucket(connection.connection.db!, {
    bucketName: "assets",
  });

  const objectId = new mongoose.Types.ObjectId(id);
  const [file] = await bucket.find({ _id: objectId }).toArray();
  if (!file) return null;

  const stream = bucket.openDownloadStream(objectId);
  const contentType =
    typeof file.metadata?.contentType === "string"
      ? file.metadata.contentType
      : "application/pdf";

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": disposition(preview, filename),
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const requestedTemplate = req.nextUrl.searchParams.get("template");
    const preview = req.nextUrl.searchParams.get("preview") === "1";

    // An explicit ?template= is the admin previewing a specific design, so it
    // always generates. Only the plain download button honours the upload.
    if (!requestedTemplate) {
      const about = await getLatestAboutLean();
      const uploaded = sanitizeUrl(about?.resumeUrl);

      if (uploaded) {
        const filename = `${slugify(about?.name || "resume")}-resume.pdf`;
        const assetId = uploaded.match(ASSET_PATH)?.[1];

        if (assetId) {
          const response = await streamUploadedResume(assetId, filename, preview);
          if (response) return response;
        } else if (/^https?:\/\//i.test(uploaded)) {
          // Externally hosted — we cannot set headers on someone else's file.
          return NextResponse.redirect(uploaded);
        }
      }
    }

    const template = requestedTemplate
      ? normalizeResumeTemplate(requestedTemplate)
      : undefined;
    const data = await getResumeData(template);
    const pdf = generateResumePdf(data, data.template);
    const filename = `${slugify(data.name || "resume")}-${data.template}.pdf`;

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition(preview, filename),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to generate resume PDF" },
      { status: 500 }
    );
  }
}
