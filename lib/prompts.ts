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
  | "blueprint"
  // New styles
  | "anime"
  | "chibi"
  | "comic"
  | "realistic"
  | "clay3d"
  | "glassmorphism"
  | "woodcut"
  | "embroidery"
  | "retrowave"
  | "minimalist"
  | "infographic"
  | "mascot";

export interface StyleOption {
  id: StyleType;
  name: string;
  description: string;
  emoji: string;
  category: "icon" | "illustration" | "design" | "character" | "artistic";
  prompt: string;
  tier: "free" | "pro";
}

export const STYLE_CATEGORIES = [
  { id: "icon" as const, name: "Icons", description: "App icons & symbols" },
  { id: "character" as const, name: "Characters", description: "Character & mascot art" },
  { id: "illustration" as const, name: "Illustrations", description: "Artistic styles" },
  { id: "artistic" as const, name: "Artistic", description: "Fine art & craft" },
  { id: "design" as const, name: "Design", description: "Professional assets" },
];

export const STYLE_OPTIONS: StyleOption[] = [
  // ─── Icons ───
  {
    id: "flat",
    name: "Flat Icon",
    description: "Clean, minimal solid colors",
    emoji: "🎨",
    category: "icon",
    tier: "free",
    prompt: `You are a professional icon designer. Transform the attached rough sketch into a polished, production-ready flat design icon.

Requirements:
- Use a cohesive palette of 3-5 solid, vibrant colors. No gradients, no shadows, no textures.
- Maintain sharp, pixel-perfect edges with clean geometric shapes.
- Simplify the sketch into its essential recognizable form — remove unnecessary details.
- Ensure visual balance and symmetry where appropriate.
- The icon must be clearly readable at 64x64px and look great at 512x512px.
- White or transparent background. No border or frame around the icon.
- Output a single, centered icon filling ~80% of the canvas.`,
  },
  {
    id: "lineart",
    name: "Line Art",
    description: "Precise single-weight strokes",
    emoji: "✏️",
    category: "icon",
    tier: "free",
    prompt: `You are a master illustrator specializing in line art. Transform the attached rough sketch into elegant, professional line art.

Requirements:
- Use clean, uniform-weight black strokes on a pure white background.
- Lines must be smooth, confident, and continuous — no sketchy or wobbly marks.
- Maintain consistent stroke width throughout (approximately 2-3px at standard resolution).
- Capture the essence of the original sketch while refining proportions and symmetry.
- Add subtle detail through line density variation — closer lines for shadow areas, sparse for highlights.
- No fills, no colors, no gradients — pure monochrome linework only.
- The result should look like professional technical illustration or refined pen artwork.`,
  },
  {
    id: "pixel",
    name: "Pixel Art",
    description: "Retro 8-bit game style",
    emoji: "👾",
    category: "icon",
    tier: "free",
    prompt: `You are a pixel art specialist. Transform the attached rough sketch into charming, authentic pixel art.

Requirements:
- Use a limited palette of 8-16 colors maximum, inspired by classic 16-bit game consoles.
- Each pixel must be clearly visible and intentionally placed — no anti-aliasing or smooth gradients.
- Maintain clean pixel clusters with deliberate dithering patterns for shading.
- The design should be recognizable and appealing at small sizes (32x32 to 64x64 logical pixels).
- Use consistent pixel density throughout the entire image.
- Apply classic pixel art techniques: outlining with a darker shade, highlight pixels for dimension.
- Clean solid-color background. Crisp, grid-aligned pixel edges.`,
  },
  {
    id: "sticker",
    name: "Sticker",
    description: "Bold outline, vibrant fill",
    emoji: "🏷️",
    category: "icon",
    tier: "free",
    prompt: `You are a sticker designer for messaging apps. Transform the attached rough sketch into a vibrant, eye-catching sticker.

Requirements:
- Use a bold, consistent dark outline (3-4px) around all shapes.
- Fill with bright, saturated, cheerful colors — think popular messaging sticker packs.
- Add a white die-cut border (5-8px) around the entire design as if it were a vinyl sticker.
- Slight 3D pop effect with subtle drop shadow beneath the sticker.
- The design should be expressive, playful, and instantly readable at small sizes.
- Keep details minimal but impactful — favor bold shapes over fine details.
- Transparent or white background outside the sticker border.`,
  },

  // ─── Characters ───
  {
    id: "kawaii",
    name: "Kawaii",
    description: "Cute Japanese-style character",
    emoji: "🌸",
    category: "character",
    tier: "free",
    prompt: `You are a kawaii character designer. Transform the attached rough sketch into an adorable kawaii-style illustration.

Requirements:
- Use soft pastel colors: light pink, baby blue, mint green, lavender, cream yellow.
- All shapes should be rounded and soft — no sharp corners or angular forms.
- If the subject can have a face, add simple dot eyes, a tiny mouth, and pink blush marks on cheeks.
- Add subtle sparkle effects (✦) or small hearts/stars around the character.
- Proportions should be chibi-like: large head relative to body if applicable.
- The overall feeling should evoke "cute overload" — warm, friendly, huggable.
- Clean light-colored or white background.`,
  },
  {
    id: "chibi",
    name: "Chibi",
    description: "Super-deformed cute style",
    emoji: "🧸",
    category: "character",
    tier: "pro",
    prompt: `You are a chibi character artist. Transform the attached rough sketch into a super-deformed chibi-style character illustration.

Requirements:
- Head-to-body ratio should be approximately 1:1 (very large head, tiny body).
- Large, expressive eyes with detailed highlights and reflections.
- Tiny hands and feet with simplified fingers.
- Use bright, anime-inspired colors with clean cel-shading (2-3 tone levels per color).
- Add dynamic expression — the character should convey emotion clearly.
- Clean black outlines with varying weight (thicker on outside, thinner on details).
- If the sketch isn't a character, anthropomorphize it into a chibi character.
- White or light pastel background.`,
  },
  {
    id: "anime",
    name: "Anime",
    description: "Japanese animation style",
    emoji: "⚡",
    category: "character",
    tier: "pro",
    prompt: `You are a professional anime illustrator. Transform the attached rough sketch into a polished anime-style illustration.

Requirements:
- Use classic anime/manga visual language: clean outlines, cel-shading, expressive features.
- Apply 2-3 levels of cel-shading with clean shadow edges — no soft gradients.
- Eyes should be detailed and expressive with highlights and color depth.
- Hair should have dynamic flow with distinct strand groupings and shading.
- Use a vibrant but harmonious color palette typical of modern anime.
- Add subtle rim lighting or backlighting effect for depth.
- Clean, confident linework with variable stroke weight.
- If the subject is not a character, illustrate it in anime illustration style (like anime background art).
- White or simple gradient background.`,
  },
  {
    id: "mascot",
    name: "Mascot",
    description: "Brand character design",
    emoji: "🦊",
    category: "character",
    tier: "pro",
    prompt: `You are a brand mascot designer. Transform the attached rough sketch into a professional mascot character.

Requirements:
- Design a friendly, approachable character suitable for brand identity use.
- Use bold, clean shapes with strong silhouette recognition.
- Limit the palette to 4-5 colors for brand consistency.
- The character should be expressive and convey positivity/friendliness.
- Design should work at multiple sizes — from favicon to billboard.
- Clean vector-like rendering with smooth curves and consistent outlines.
- Add personality through pose, expression, and small characteristic details.
- If the sketch is an object/concept, anthropomorphize it into a lovable mascot.
- White background, centered composition.`,
  },
  {
    id: "comic",
    name: "Comic Book",
    description: "Western comic panel art",
    emoji: "💥",
    category: "character",
    tier: "pro",
    prompt: `You are a comic book artist. Transform the attached rough sketch into a dynamic comic book style illustration.

Requirements:
- Use bold black inking with variable line weights — thick outlines, thin details.
- Apply classic comic book coloring: flat base colors with halftone dot shading patterns.
- Add dramatic lighting with strong shadows and highlights.
- Include action lines, speed lines, or impact effects where appropriate.
- The composition should feel dynamic and energetic.
- Text effects like "POW" or "BOOM" are welcome if fitting the subject.
- Use a bold, saturated color palette typical of superhero comics.
- White background or simple action background.`,
  },

  // ─── Illustrations ───
  {
    id: "isometric",
    name: "3D Isometric",
    description: "Depth with 30° perspective",
    emoji: "📦",
    category: "illustration",
    tier: "free",
    prompt: `You are an isometric illustration specialist. Transform the attached rough sketch into a polished 3D isometric illustration.

Requirements:
- Strict isometric perspective: 30-degree angles, no vanishing points, parallel projection.
- Use bright, modern colors with clean flat surfaces and subtle shadows for depth.
- Each surface plane should have distinct brightness: top (lightest), left, right (darkest).
- Maintain consistent scale and grid alignment across all elements.
- Add small contextual details that bring the scene to life.
- Edges should be crisp and geometric with no hand-drawn feel.
- The result should look like a premium app illustration or infographic element.
- Clean white background with optional subtle shadow beneath the object.`,
  },
  {
    id: "watercolor",
    name: "Watercolor",
    description: "Soft painted art style",
    emoji: "💧",
    category: "illustration",
    tier: "pro",
    prompt: `You are a watercolor painting master. Transform the attached rough sketch into a beautiful watercolor-style illustration.

Requirements:
- Replicate authentic watercolor painting characteristics: soft color bleeds, pigment granulation, wet-on-wet effects.
- Use a harmonious palette with natural color mixing and subtle gradients.
- Preserve white paper areas as highlights — watercolor leaves the white of the paper showing through.
- Edges should vary between soft wet blends and crisp dry-brush strokes.
- Add natural paper texture visible through the paint.
- Layer transparent washes — lighter layers underneath, details painted on top.
- The result should look hand-painted by a skilled watercolor artist.
- Light, airy composition with breathing room around the subject.`,
  },
  {
    id: "neon",
    name: "Neon Glow",
    description: "Glowing neon light effect",
    emoji: "💜",
    category: "illustration",
    tier: "pro",
    prompt: `You are a neon art designer. Transform the attached rough sketch into a stunning neon glow effect illustration.

Requirements:
- Render the subject as glowing neon tubes against a dark background (near-black, #0a0a0f).
- Primary neon colors: electric cyan (#00f0ff), hot magenta (#ff00aa), vivid purple (#8b00ff), electric blue (#0066ff).
- Apply realistic glow physics: bright white core, saturated color mid-glow, soft ambient outer glow.
- Add subtle light reflection/bloom on nearby surfaces.
- Lines should look like actual bent glass neon tubes — smooth curves, consistent width.
- Include subtle ambient atmosphere — slight fog/haze catching the neon light.
- The overall mood should be cyberpunk/synthwave nightlife.
- Dark background with the neon subject as the focal point.`,
  },
  {
    id: "clay3d",
    name: "3D Clay",
    description: "Soft clay render style",
    emoji: "🏺",
    category: "illustration",
    tier: "pro",
    prompt: `You are a 3D clay art specialist. Transform the attached rough sketch into a charming claymation-style 3D render.

Requirements:
- Render the subject as if sculpted from soft, matte clay or plasticine.
- Use warm, saturated colors with a slightly desaturated matte finish.
- Apply soft ambient occlusion and gentle shadows for a cozy 3D feel.
- Surfaces should have subtle imperfections — gentle bumps, fingerprint-like textures.
- Rounded edges everywhere — nothing should be perfectly sharp.
- Use soft studio lighting: main light from top-left, subtle fill from right, ambient bounce.
- The result should feel tactile and touchable, like a Pixar-style character or object.
- Clean gradient or soft solid background.`,
  },

  // ─── Artistic ───
  {
    id: "woodcut",
    name: "Woodcut",
    description: "Traditional block print",
    emoji: "🪵",
    category: "artistic",
    tier: "pro",
    prompt: `You are a traditional woodcut printmaking artist. Transform the attached rough sketch into a woodcut-style illustration.

Requirements:
- Use only black ink on white (or white on dark wood-brown) — pure two-tone contrast.
- Render forms through carved line patterns: cross-hatching, parallel lines, stippling for tone.
- Lines should follow the contour of forms, suggesting volume through direction.
- Bold, rough-edged marks that feel hand-carved into a wood block.
- High contrast with dramatic interplay of positive and negative space.
- No smooth gradients — all tonal variation achieved through line density.
- The result should look like an authentic relief print from a carved woodblock.
- Classic woodcut aesthetic with strong graphic impact.`,
  },
  {
    id: "embroidery",
    name: "Embroidery",
    description: "Cross-stitch textile art",
    emoji: "🧵",
    category: "artistic",
    tier: "pro",
    prompt: `You are a textile art specialist. Transform the attached rough sketch into a realistic embroidery/cross-stitch design.

Requirements:
- Render the subject as if stitched with thread on fabric.
- Individual stitches should be visible — use satin stitch, cross-stitch, or backstitch patterns.
- Show realistic thread texture with slight dimensional height and light catching on thread fibers.
- Use a natural linen or cotton fabric background texture.
- Color palette should reflect available embroidery thread colors — rich and slightly muted.
- Add a subtle shadow beneath the stitched areas to show dimensional lift.
- Include an embroidery hoop frame around the design.
- The result should look like a photograph of actual completed needlework.`,
  },
  {
    id: "retrowave",
    name: "Retrowave",
    description: "80s synthwave aesthetic",
    emoji: "🌅",
    category: "artistic",
    tier: "pro",
    prompt: `You are a retrowave/synthwave visual artist. Transform the attached rough sketch into an 80s retrowave aesthetic illustration.

Requirements:
- Use the classic retrowave palette: hot pink, electric purple, cyan, chrome, sunset orange gradients.
- Include signature elements: perspective grid lines receding to horizon, sunset gradient sky.
- Apply chrome/metallic reflective effects on key surfaces.
- Add scan lines or VHS distortion effects subtly.
- Typography elements if text is present should use chrome or neon 80s-style fonts.
- Palm trees, geometric shapes, or stars as secondary elements if appropriate.
- Strong horizon line with gradient sky transitioning from dark purple to hot pink/orange.
- The overall vibe should be "Miami Vice meets Tron" — nostalgic 80s futurism.`,
  },

  // ─── Design ───
  {
    id: "hero",
    name: "Hero Banner",
    description: "Bold website header art",
    emoji: "🖼️",
    category: "design",
    tier: "pro",
    prompt: `You are a web design illustrator. Transform the attached rough sketch into a bold, professional hero banner illustration.

Requirements:
- Wide composition optimized for hero/header sections (roughly 16:9 aspect ratio).
- Use a vibrant, modern color palette with strong visual hierarchy.
- The main subject should be prominent and immediately eye-catching.
- Apply contemporary design trends: subtle gradients, geometric accents, layered depth.
- Include breathing room for potential text overlay (keep some areas visually simpler).
- The illustration should feel dynamic and premium — suitable for a SaaS or startup landing page.
- Clean, intentional composition with focal point in the center or golden ratio position.
- Professional quality that would work alongside top-tier brand design.`,
  },
  {
    id: "logo",
    name: "Logo Mark",
    description: "Simple brandable symbol",
    emoji: "⭐",
    category: "design",
    tier: "pro",
    prompt: `You are a brand identity designer. Transform the attached rough sketch into a clean, professional logo mark.

Requirements:
- Distill the sketch into its most essential geometric form — maximum simplicity.
- Use 1-2 colors maximum (plus black/white). The logo must work in single color.
- Perfect geometric construction: circles, squares, golden ratio proportions where possible.
- The mark must be instantly recognizable and memorable.
- Test-worthy at all sizes: from 16px favicon to billboard scale.
- Strong negative space usage — consider clever figure-ground relationships.
- No fine details that would be lost at small sizes.
- Centered on white background with generous padding.
- The result should look like it was designed by a top branding agency.`,
  },
  {
    id: "svg",
    name: "Vector",
    description: "Clean geometric shapes",
    emoji: "📐",
    category: "design",
    tier: "free",
    prompt: `You are a vector illustration specialist. Transform the attached rough sketch into a clean vector-style graphic.

Requirements:
- Use flat colors with mathematically clean shape boundaries — no hand-drawn feel.
- Limit to 5-8 colors from a harmonious palette. No gradients or textures.
- All shapes should be geometric and precise: perfect circles, straight lines, consistent curves.
- Minimize detail while maximizing recognizability — every shape must earn its place.
- The result should look like a professional SVG illustration from a design system.
- Consistent visual weight across all elements.
- Clean white background with the graphic centered and well-proportioned.
- Think: Google Material Design illustrations or Stripe's website graphics.`,
  },
  {
    id: "blueprint",
    name: "Blueprint",
    description: "Technical schematic style",
    emoji: "📘",
    category: "design",
    tier: "pro",
    prompt: `You are a technical illustrator. Transform the attached rough sketch into a blueprint-style technical drawing.

Requirements:
- White/light-blue lines on a deep blueprint-blue background (#003366).
- Include a subtle grid pattern (graph paper style) on the background.
- Add dimension lines with measurements and technical annotations.
- Use proper technical drawing conventions: dashed lines for hidden edges, center lines, section marks.
- Include a title block in the bottom-right corner with placeholder text.
- All lines should be precise and ruler-straight where appropriate.
- Multiple views if applicable: front, side, top-down orthographic projections.
- The result should look like an authentic architectural or engineering blueprint.`,
  },
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    description: "Frosted glass UI effect",
    emoji: "🪟",
    category: "design",
    tier: "pro",
    prompt: `You are a UI/UX designer specializing in glassmorphism. Transform the attached rough sketch into a glassmorphism-style design element.

Requirements:
- Render the subject as frosted glass panels with blurred transparency effect.
- Use subtle white/light borders (1px, 20% opacity) on glass edges.
- Background should show a colorful gradient (purple-blue-pink) visible through the frosted glass.
- Apply realistic glass refraction: slight color shift and blur of background elements.
- Subtle inner shadows and highlights to suggest glass curvature.
- Modern, clean aesthetic suitable for a premium app or dashboard UI.
- Add soft colored ambient lighting reflecting off the glass surfaces.
- The overall effect should feel premium, modern, and tactile.`,
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Essential form only",
    emoji: "◻️",
    category: "design",
    tier: "free",
    prompt: `You are a minimalist designer. Transform the attached rough sketch into an ultra-minimal design.

Requirements:
- Reduce the subject to its absolute essential form — remove everything that isn't necessary.
- Use maximum 2 colors: one primary color plus black or white.
- Generous whitespace — the subject should occupy only 30-40% of the canvas.
- Clean geometric reduction: circles, lines, rectangles — the simplest possible representation.
- Every element must be intentional and essential.
- No textures, no gradients, no shadows, no decorative elements.
- The result should feel like a premium brand's design language — think Apple or Muji.
- Centered composition on white background with perfect visual balance.`,
  },
  {
    id: "infographic",
    name: "Infographic",
    description: "Data visualization style",
    emoji: "📊",
    category: "design",
    tier: "pro",
    prompt: `You are an infographic designer. Transform the attached rough sketch into a polished infographic-style illustration.

Requirements:
- Render the subject as a data visualization or infographic element.
- Use a clean, professional color palette with 4-5 distinct colors for different data categories.
- Include visual elements typical of infographics: icons, charts, flow lines, percentage indicators.
- Apply flat design with subtle long shadows or material design elevation.
- Clear visual hierarchy: large focal element surrounded by supporting data points.
- Use consistent iconography style throughout all elements.
- Include placeholder labels and numbers to make it look like a real infographic.
- White background with clean grid-based layout.`,
  },
  {
    id: "realistic",
    name: "Realistic",
    description: "Photo-realistic rendering",
    emoji: "📸",
    category: "illustration",
    tier: "pro",
    prompt: `You are a photorealistic digital artist. Transform the attached rough sketch into a highly realistic rendering.

Requirements:
- Render the subject with photographic realism: accurate lighting, materials, and proportions.
- Apply physically accurate material properties: metal reflections, fabric texture, skin subsurface scattering.
- Use natural studio lighting setup: key light, fill light, rim light for professional look.
- Include realistic shadows with proper softness based on light distance.
- Fine surface details: textures, micro-scratches, pores, grain — whatever suits the material.
- Accurate color representation as it would appear in real life.
- The result should be indistinguishable from a photograph or high-end 3D render.
- Clean neutral background (soft gray gradient or studio backdrop).`,
  },
];

export function getPromptForStyle(style: StyleType): string {
  const option = STYLE_OPTIONS.find((s) => s.id === style);
  if (!option) {
    throw new Error(`Unknown style: ${style}`);
  }
  return option.prompt;
}
