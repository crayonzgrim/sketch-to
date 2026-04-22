import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTodayUsage } from "@/lib/usage";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const usage = await getTodayUsage(session.user.id);
    return NextResponse.json({
      success: true,
      usage,
      limit: 3,
    });
  } catch (error) {
    console.error("Usage fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
