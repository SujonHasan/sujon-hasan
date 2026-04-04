import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/auth-guard";
import { seoSchema } from "@/lib/validations";
import Seo from "@/models/Seo";
import About from "@/models/About";
import Project from "@/models/Project";
import Skill from "@/models/Skill";

async function generateSeoContent() {
  const about = await About.findOne();
  const projectCount = await Project.countDocuments({ status: "published" });
  const skills = await Skill.find().sort({ proficiency: -1 }).limit(5);

  const name = about?.name || "Md. Sujon Hasan";
  const tagline = about?.tagline || "Full Stack Developer";
  const topSkills = skills.map((s: { name: string }) => s.name).join(", ");

  const metaTitle = `${name} | ${tagline} | Portfolio`;
  const metaDescription = `${name} is a ${tagline} with expertise in ${topSkills}. Explore ${projectCount}+ projects and professional experience. Available for freelance work.`;
  const keywords = [
    name,
    tagline,
    ...skills.map((s: { name: string }) => s.name),
    "portfolio",
    "web developer",
    "MERN stack",
  ];

  return { metaTitle, metaDescription, keywords };
}

export async function GET() {
  try {
    await connectDB();
    let seo = await Seo.findOne({ page: "home" });

    if (!seo || seo.autoGenerate) {
      const generated = await generateSeoContent();
      if (seo?.autoGenerate) {
        seo.metaTitle = generated.metaTitle;
        seo.metaDescription = generated.metaDescription;
        seo.keywords = generated.keywords;
        await seo.save();
      }
      if (!seo) {
        seo = await Seo.create({ page: "home", ...generated, autoGenerate: true });
      }
    }

    return NextResponse.json({ success: true, data: seo });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch SEO" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return withAuth(req, async (request) => {
    try {
      const body = await request.json();
      const validated = seoSchema.parse(body);

      await connectDB();

      // If autoGenerate is true, regenerate content
      if (validated.autoGenerate) {
        const generated = await generateSeoContent();
        validated.metaTitle = generated.metaTitle;
        validated.metaDescription = generated.metaDescription;
        validated.keywords = generated.keywords;
      }

      const seo = await Seo.findOneAndUpdate({ page: "home" }, validated, {
        new: true,
        upsert: true,
      });

      return NextResponse.json({ success: true, data: seo });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json({ success: false, error: "Validation failed", details: error }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: "Failed to update SEO" }, { status: 500 });
    }
  });
}
