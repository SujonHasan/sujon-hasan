import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/auth-guard";
import { skillSchema } from "@/lib/validations";
import Skill from "@/models/Skill";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectDB();
    const skill = await Skill.findById(id);
    if (!skill) return NextResponse.json({ success: false, error: "Skill not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: skill });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch skill" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  return withAuth(req, async (request) => {
    try {
      const { id } = await context.params;
      const body = await request.json();
      const validated = skillSchema.partial().parse(body);
      await connectDB();
      const skill = await Skill.findByIdAndUpdate(id, validated, { new: true });
      if (!skill) return NextResponse.json({ success: false, error: "Skill not found" }, { status: 404 });
      return NextResponse.json({ success: true, data: skill });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json({ success: false, error: "Validation failed", details: error }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: "Failed to update skill" }, { status: 500 });
    }
  });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  return withAuth(req, async () => {
    try {
      const { id } = await context.params;
      await connectDB();
      const skill = await Skill.findByIdAndDelete(id);
      if (!skill) return NextResponse.json({ success: false, error: "Skill not found" }, { status: 404 });
      return NextResponse.json({ success: true, message: "Skill deleted" });
    } catch {
      return NextResponse.json({ success: false, error: "Failed to delete skill" }, { status: 500 });
    }
  });
}
