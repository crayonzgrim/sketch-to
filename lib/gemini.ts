import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPromptForStyle, type StyleType } from "./prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface GenerateImageResult {
  image: string; // base64
  mimeType: string;
}

export async function generateImage(
  base64Image: string,
  mimeType: string,
  style: StyleType,
  customPrompt?: string
): Promise<GenerateImageResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-image",
    generationConfig: {
      // @ts-expect-error - responseModalities is supported but not in types yet
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  let prompt = getPromptForStyle(style);
  if (customPrompt) {
    prompt += `\n\nAdditional user instructions:\n${customPrompt}`;
  }

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    },
    { text: prompt },
  ]);

  const response = result.response;
  const parts = response.candidates?.[0]?.content?.parts;

  if (!parts) {
    throw new Error("No response from Gemini API");
  }

  for (const part of parts) {
    if (part.inlineData) {
      return {
        image: part.inlineData.data,
        mimeType: part.inlineData.mimeType || "image/png",
      };
    }
  }

  throw new Error("No image in Gemini API response");
}
