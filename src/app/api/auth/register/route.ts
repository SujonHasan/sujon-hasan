import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  if (process.env.ENABLE_REGISTRATION !== "true") {
    return NextResponse.json(
      { success: false, error: "Registration is disabled" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User already exists with this email" },
        { status: 400 }
      );
    }

    const user = await User.create({ name, email, password, role: "editor" });
    const token = await signToken(user._id.toString());

    const response = NextResponse.json(
      {
        success: true,
        data: {
          token,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      },
      { status: 201 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
