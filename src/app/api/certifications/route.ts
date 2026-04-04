import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/auth-guard";
import { certificationSchema } from "@/lib/validations";
import Certification from "@/models/Certification";

export async function GET() {
  try {
    await connectDB();
    const certs = await Certification.find().sort({ order: 1, issueDate: -1 });
    return NextResponse.json({ success: true, data: certs });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch certifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (request) => {
    try {
      const body = await request.json();
      const validated = certificationSchema.parse(body);
      await connectDB();
      const cert = await Certification.create(validated);
      return NextResponse.json({ success: true, data: cert }, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json({ success: false, error: "Validation failed", details: error }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: "Failed to create certification" }, { status: 500 });
    }
  });
}
