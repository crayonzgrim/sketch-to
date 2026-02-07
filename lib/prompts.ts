export type StyleType =
  | "flat"
  | "lineart"
  | "isometric"
  | "kawaii"
  | "hero"
  | "svg"
  | "pixel"
  | "watercolor"
  | "neon"
  | "sticker"
  | "logo"
  | "blueprint";

export interface StyleOption {
  id: StyleType;
  name: string;
  description: string;
  emoji: string;
  category: "icon" | "illustration" | "design";
  prompt: string;
}

export const STYLE_CATEGORIES = [
  { id: "icon" as const, name: "Icons", description: "App icons & favicons" },
  { id: "illustration" as const, name: "Illustrations", description: "Artistic styles" },
  { id: "design" as const, name: "Design", description: "Professional assets" },
];

export const STYLE_OPTIONS: StyleOption[] = [
  // Icons
  {
    id: "flat",
    name: "Flat Icon",
    description: "Clean, minimal solid colors",
    emoji: "🎨",
    category: "icon",
    prompt:
      "Transform this rough sketch into a clean, professional flat design icon. Use solid colors with no gradients or shadows. Keep the design minimal and recognizable. Output a polished 2D flat icon with sharp edges and a cohesive color palette. White or transparent background.",
  },
  {
    id: "lineart",
    name: "Line Art",
    description: "Precise single-weight strokes",
    emoji: "✏️",
    category: "icon",
    prompt:
      "Transform this rough sketch into elegant, professional line art. Use clean, consistent-weight strokes. The result should look like a refined technical or artistic illustration with precise linework. Monochrome black lines on white background.",
  },
  {
    id: "pixel",
    name: "Pixel Art",
    description: "Retro 8-bit game style",
    emoji: "👾",
    category: "icon",
    prompt:
      "Transform this rough sketch into charming pixel art. Use a limited color palette with clearly visible individual pixels. The style should be reminiscent of classic 8-bit or 16-bit video games. Keep the design recognizable at small sizes. Clean background with crisp pixel edges.",
  },
  {
    id: "sticker",
    name: "Sticker",
    description: "Bold outline, vibrant fill",
    emoji: "🏷️",
    category: "icon",
    prompt:
      "Transform this rough sketch into a vibrant sticker design. Use bold, thick outlines with bright, saturated fill colors. Add a subtle white border/stroke around the entire design as if it were a die-cut sticker. The result should be eye-catching and playful. Clean transparent or white background.",
  },
  // Illustrations
  {
    id: "isometric",
    name: "3D Isometric",
    description: "Depth with 30° perspective",
    emoji: "📦",
    category: "illustration",
    prompt:
      "Transform this rough sketch into a vibrant 3D isometric illustration. Use an isometric perspective (30-degree angle). Apply bright, modern colors with subtle shadows to create depth. The result should look like a professional isometric icon or illustration. Clean white background.",
  },
  {
    id: "kawaii",
    name: "Kawaii",
    description: "Cute Japanese-style character",
    emoji: "🌸",
    category: "illustration",
    prompt:
      "Transform this rough sketch into an adorable kawaii-style character or illustration. Use soft pastel colors, rounded shapes, and cute facial expressions. Add subtle blush marks and sparkle effects. The style should be reminiscent of Japanese cute culture. Clean background.",
  },
  {
    id: "watercolor",
    name: "Watercolor",
    description: "Soft painted art style",
    emoji: "💧",
    category: "illustration",
    prompt:
      "Transform this rough sketch into a beautiful watercolor-style illustration. Use soft, blended colors with visible paint texture and gentle color bleeds. The result should look like a hand-painted watercolor artwork with organic edges and subtle gradients. Light, airy background.",
  },
  {
    id: "neon",
    name: "Neon Glow",
    description: "Glowing neon light effect",
    emoji: "💜",
    category: "illustration",
    prompt:
      "Transform this rough sketch into a striking neon glow effect illustration. Use bright, luminous colors (cyan, magenta, purple, electric blue) with visible glow and bloom effects against a dark background. The lines should appear as glowing neon tubes. Dark background (near black) with vivid neon light effects.",
  },
  // Design
  {
    id: "hero",
    name: "Hero Banner",
    description: "Bold website header art",
    emoji: "🖼️",
    category: "design",
    prompt:
      "Transform this rough sketch into a bold, professional hero banner illustration suitable for a website header. Use vibrant colors, dynamic composition, and modern design trends. The illustration should be eye-catching and suitable for a landing page. Wide aspect ratio preferred.",
  },
  {
    id: "logo",
    name: "Logo Mark",
    description: "Simple brandable symbol",
    emoji: "⭐",
    category: "design",
    prompt:
      "Transform this rough sketch into a clean, professional logo mark. Use simple geometric shapes with a maximum of 2-3 colors. The design should be highly recognizable, scalable, and work at any size. Avoid complex details. The result should look like a professional brand logo or monogram. Clean white background.",
  },
  {
    id: "svg",
    name: "Vector",
    description: "Clean geometric shapes",
    emoji: "📐",
    category: "design",
    prompt:
      "Transform this rough sketch into a clean vector-style graphic. Use flat colors with clear shape boundaries. Minimize detail complexity while maintaining recognizability. The result should look like it could be an SVG illustration — geometric, clean, and scalable. Limited color palette, no gradients.",
  },
  {
    id: "blueprint",
    name: "Blueprint",
    description: "Technical schematic style",
    emoji: "📘",
    category: "design",
    prompt:
      "Transform this rough sketch into a technical blueprint-style drawing. Use white/light blue lines on a deep blue background with a subtle grid pattern. Include dimension lines and technical annotations where appropriate. The result should look like an architectural or engineering blueprint. Classic blueprint blue background.",
  },
];

export function getPromptForStyle(style: StyleType): string {
  const option = STYLE_OPTIONS.find((s) => s.id === style);
  if (!option) {
    throw new Error(`Unknown style: ${style}`);
  }
  return option.prompt;
}
