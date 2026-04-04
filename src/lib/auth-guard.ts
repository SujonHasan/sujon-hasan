import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";
import { connectDB } from "./db";
import User from "@/models/User";

export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized - No token provided" },
      { status: 401 }
    );
  }

  const token = authHeader.split(" ")[1];
  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { success: false, error: "Unauthorized - Invalid token" },
      { status: 401 }
    );
  }

  await connectDB();
  const user = await User.findById(payload.userId).select("-password");

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized - User not found" },
      { status: 401 }
    );
  }

  return handler(req, payload.userId);
}
