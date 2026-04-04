import { NextRequest, NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = contactFormSchema.parse(body);

    // In production, send email via nodemailer or a service like SendGrid
    // For now, just log and return success
    console.log("Contact form submission:", validated);

    return NextResponse.json({
      success: true,
      message: "Message sent successfully! I will get back to you soon.",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
  }
}
