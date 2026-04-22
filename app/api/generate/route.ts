import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini";
import { type StyleType, STYLE_OPTIONS } from "@/lib/prompts";
import { auth } from "@/lib/auth";
import { checkUsageAllowed, incrementUsage, getTodayUsage } from "@/lib/usage";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const allowed = await checkUsageAllowed(session.user.id);
    if (!allowed) {
      const usage = await getTodayUsage(session.user.id);
      return NextResponse.json(
        {
          success: false,
          error: "Daily limit reached. 3 requests per day.",
          usage,
          limit: 3,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { imageBase64, mimeType, style, customPrompt } = body as {
      imageBase64: string;
      mimeType: string;
      style: StyleType;
      customPrompt?: string;
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

    const sanitizedPrompt = customPrompt?.slice(0, 500);
    const result = await generateImage(
      imageBase64,
      mimeType || "image/png",
      style,
      sanitizedPrompt
    );

    await incrementUsage(session.user.id);

    return NextResponse.json({
      success: true,
      image: result.image,
      mimeType: result.mimeType,
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