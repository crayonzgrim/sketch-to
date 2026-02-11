"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  resizeImage,
  convertToFormat,
  generateIco,
  downloadImage,
  downloadBlob,
  getFileExtension,
  getMimeType,
  SIZE_OPTIONS,
  type ImageFormat,
  type SizeOption,
} from "@/lib/image-utils";

interface DownloadOptionsProps {
  generatedImage: string;
  generatedMimeType: string;
}

export function DownloadOptions({
  generatedImage,
  generatedMimeType,
}: DownloadOptionsProps) {
  const [format, setFormat] = useState<ImageFormat>("png");
  const [size, setSize] = useState<SizeOption>("256");
  const [isProcessing, setIsProcessing] = useState(false);

  // ICO supports up to 256x256
  const availableSizes =
    format === "ico"
      ? SIZE_OPTIONS.filter((s) => {
          if (s.value === "original") return false;
          const n = parseInt(s.value);
          return n <= 256;
        })
      : SIZE_OPTIONS;

  // Reset size when switching to ICO with incompatible size
  const handleFormatChange = (v: string) => {
    const newFormat = v as ImageFormat;
    setFormat(newFormat);
    if (newFormat === "ico") {
      const n = parseInt(size);
      if (size === "original" || n > 256) {
        setSize("32");
      }
    }
  };

  const handleDownload = async () => {
    setIsProcessing(true);
    try {
      if (format === "ico") {
        const dimension = parseInt(size) || 32;
        const blob = await generateIco(generatedImage, generatedMimeType, dimension);
        downloadBlob(blob, `sketchto-${dimension}x${dimension}.ico`);
      } else {
        let processedImage = generatedImage;

        if (size !== "original") {
          const dimension = parseInt(size);
          processedImage = await resizeImage(
            processedImage,
            generatedMimeType,
            dimension,
            dimension
          );
        }

        processedImage = await convertToFormat(
          processedImage,
          generatedMimeType,
          format
        );

        const sizeLabel = size === "original" ? "original" : `${size}x${size}`;
        const filename = `sketchto-${sizeLabel}.${getFileExtension(format)}`;
        downloadImage(processedImage, filename, getMimeType(format));
      }
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      // Brief cooldown to prevent rapid consecutive downloads
      setTimeout(() => setIsProcessing(false), 1500);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Format</label>
            <Select value={format} onValueChange={handleFormatChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (transparent)</SelectItem>
                <SelectItem value="jpeg">JPG (smaller file)</SelectItem>
                <SelectItem value="ico">ICO (favicon)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Size</label>
            <Select
              value={size}
              onValueChange={(v) => setSize(v as SizeOption)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableSizes.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                    <span className="ml-2 text-muted-foreground">
                      {opt.description}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleDownload}
            disabled={isProcessing}
            className="sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            {isProcessing ? "Processing..." : "Download"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
