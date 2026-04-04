import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/auth-guard";
import { verifyToken } from "@/lib/auth";
import { sanitizeRichText } from "@/lib/sanitize";
import { projectSchema } from "@/lib/validations";
import Project from "@/models/Project";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectDB();
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
    const authPayload = token ? await verifyToken(token) : null;
    const filter: Record<string, unknown> = { _id: id };

    if (!authPayload) {
      filter.status = "published";
    }

    const project = await Project.findOne(filter);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    if (!authPayload) {
      project.views += 1;
      await project.save();
    }

    return NextResponse.json({ success: true, data: project });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  return withAuth(req, async (request) => {
    try {
      const { id } = await context.params;
      const body = await request.json();
      const validated = projectSchema.partial().parse(body);
      if (validated.description !== undefined) {
        validated.description = sanitizeRichText(validated.description);
      }

      await connectDB();
      const project = await Project.findByIdAndUpdate(id, validated, { new: true, runValidators: true });
      if (!project) {
        return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: project });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json({ success: false, error: "Validation failed", details: error }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: "Failed to update project" }, { status: 500 });
    }
  });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  return withAuth(req, async () => {
    try {
      const { id } = await context.params;
      await connectDB();
      const project = await Project.findByIdAndDelete(id);
      if (!project) {
        return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Project deleted" });
    } catch {
      return NextResponse.json({ success: false, error: "Failed to delete project" }, { status: 500 });
    }
  });
}
