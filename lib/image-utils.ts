"use client";

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function resizeImage(
  base64: string,
  mimeType: string,
  width: number,
  height: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const outputMime =
        mimeType === "image/jpeg" ? "image/jpeg" : "image/png";
      const dataUrl = canvas.toDataURL(outputMime, 0.92);
      const resizedBase64 = dataUrl.split(",")[1];
      resolve(resizedBase64);
    };
    img.onerror = reject;
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

export function convertToFormat(
  base64: string,
  sourceMime: string,
  targetFormat: "png" | "jpeg",
  quality: number = 0.92,
  bgColor: string = "#ffffff"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      if (targetFormat === "jpeg") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      const outputMime =
        targetFormat === "jpeg" ? "image/jpeg" : "image/png";
      const dataUrl = canvas.toDataURL(outputMime, quality);
      resolve(dataUrl.split(",")[1]);
    };
    img.onerror = reject;
    img.src = `data:${sourceMime};base64,${base64}`;
  });
}

/**
 * Generate ICO file binary from a base64 image.
 * ICO format: header (6 bytes) + directory entry (16 bytes) + PNG data
 */
export async function generateIco(
  base64: string,
  mimeType: string,
  size: number
): Promise<Blob> {
  // First resize to target size as PNG
  const resizedBase64 = await resizeImage(base64, mimeType, size, size);
  const pngBase64 = await convertToFormat(resizedBase64, "image/png", "png");
  const pngBytes = Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0));

  // ICO header: 6 bytes
  const header = new ArrayBuffer(6);
  const headerView = new DataView(header);
  headerView.setUint16(0, 0, true); // reserved
  headerView.setUint16(2, 1, true); // type: 1 = ICO
  headerView.setUint16(4, 1, true); // image count

  // Directory entry: 16 bytes
  const entry = new ArrayBuffer(16);
  const entryView = new DataView(entry);
  entryView.setUint8(0, size >= 256 ? 0 : size); // width (0 = 256)
  entryView.setUint8(1, size >= 256 ? 0 : size); // height (0 = 256)
  entryView.setUint8(2, 0); // color palette
  entryView.setUint8(3, 0); // reserved
  entryView.setUint16(4, 1, true); // color planes
  entryView.setUint16(6, 32, true); // bits per pixel
  entryView.setUint32(8, pngBytes.length, true); // image size
  entryView.setUint32(12, 6 + 16, true); // offset (header + 1 entry)

  return new Blob(
    [new Uint8Array(header), new Uint8Array(entry), pngBytes],
    { type: "image/x-icon" }
  );
}

export function downloadImage(
  base64: string,
  filename: string,
  mimeType: string
) {
  const link = document.createElement("a");
  link.href = `data:${mimeType};base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type ImageFormat = "png" | "jpeg" | "ico";

export function getFileExtension(format: ImageFormat): string {
  if (format === "jpeg") return "jpg";
  if (format === "ico") return "ico";
  return "png";
}

export function getMimeType(format: ImageFormat): string {
  if (format === "jpeg") return "image/jpeg";
  if (format === "ico") return "image/x-icon";
  return "image/png";
}

export const SIZE_OPTIONS = [
  { value: "16", label: "16 x 16", description: "Favicon" },
  { value: "24", label: "24 x 24", description: "Small icon" },
  { value: "32", label: "32 x 32", description: "Standard icon" },
  { value: "48", label: "48 x 48", description: "Windows icon" },
  { value: "64", label: "64 x 64", description: "Large icon" },
  { value: "128", label: "128 x 128", description: "HD icon" },
  { value: "256", label: "256 x 256", description: "Extra large" },
  { value: "512", label: "512 x 512", description: "App Store" },
  { value: "1024", label: "1024 x 1024", description: "High-res" },
  { value: "original", label: "Original", description: "As generated" },
] as const;

export type SizeOption = (typeof SIZE_OPTIONS)[number]["value"];
