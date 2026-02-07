import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateImage } from "@/lib/gemini";
import { type StyleType, STYLE_OPTIONS } from "@/lib/prompts";
import { checkUsageAllowed, incrementUsage } from "@/lib/usage";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ADMIN_EMAIL = "cappu159@gmail.com";

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Usage check
    const usage = await checkUsageAllowed(supabase, user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Daily limit reached",
          used: usage.used,
          limit: usage.limit,
          plan: usage.plan,
        },
        { status: 429 }
      );
    }

    // 3. Parse request
    const body = await request.json();
    const { imageBase64, mimeType, style } = body as {
      imageBase64: string;
      mimeType: string;
      style: StyleType;
    };

    if (!imageBase64 || !style) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: imageBase64, style" },
        { status: 400 }
      );
    }

    const styleOption = STYLE_OPTIONS.find((s) => s.id === style);
    if (!styleOption) {
      return NextResponse.json(
        { success: false, error: `Invalid style: ${style}` },
        { status: 400 }
      );
    }

    // 3.5. Style tier access check
    const isAdmin = user.email === ADMIN_EMAIL;
    const hasPaidPlan = usage.plan !== "free";
    if (styleOption.tier === "pro" && !isAdmin && !hasPaidPlan) {
      return NextResponse.json(
        { success: false, error: "This style requires a PRO plan. Please upgrade to access it." },
        { status: 403 }
      );
    }

    if (imageBase64.length > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image too large. Maximum size is 4MB." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key") {
      return NextResponse.json(
        { success: false, error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    // 4. Generate image
    const result = await generateImage(
      imageBase64,
      mimeType || "image/png",
      style
    );

    // 5. Increment usage on success
    await incrementUsage(supabase, user.id);

    return NextResponse.json({
      success: true,
      image: result.image,
      mimeType: result.mimeType,
      usage: {
        used: usage.used + 1,
        limit: usage.limit,
      },
    });
  } catch (error) {
    console.error("Image generation error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
