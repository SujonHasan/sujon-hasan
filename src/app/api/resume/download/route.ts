import { NextRequest, NextResponse } from "next/server";
import {
  generateResumePdf,
  getResumeData,
  normalizeResumeTemplate,
} from "@/lib/resume";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const requestedTemplate = req.nextUrl.searchParams.get("template");
    const template = requestedTemplate
      ? normalizeResumeTemplate(requestedTemplate)
      : undefined;
    const preview = req.nextUrl.searchParams.get("preview") === "1";
    const data = await getResumeData(template);
    const pdf = generateResumePdf(data, data.template);
    const filename = `${slugify(data.name || "resume")}-${data.template}.pdf`;

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${filename}"`,
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
