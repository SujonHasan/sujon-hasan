import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Readable } from "node:stream";
import { connectDB } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    const connection = await connectDB();
    const bucket = new mongoose.mongo.GridFSBucket(connection.connection.db!, {
      bucketName: "assets",
    });
    const objectId = new mongoose.Types.ObjectId(id);
    const files = await bucket.find({ _id: objectId }).toArray();
    const file = files[0];

    if (!file) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    const stream = bucket.openDownloadStream(objectId);
    const contentType =
      typeof file.metadata?.contentType === "string"
        ? file.metadata.contentType
        : "application/octet-stream";

    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load asset" }, { status: 500 });
  }
}
