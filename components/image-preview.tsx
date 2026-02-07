"use client";

import { RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface ImagePreviewProps {
  originalImage: string | null;
  generatedImage: string | null;
  generatedMimeType: string;
  isGenerating: boolean;
  onRegenerate: () => void;
}

export function ImagePreview({
  originalImage,
  generatedImage,
  generatedMimeType,
  isGenerating,
  onRegenerate,
}: ImagePreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Result</h3>
        {generatedImage && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isGenerating}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Original */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Original</p>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {originalImage ? (
                <img
                  src={originalImage}
                  alt="Original sketch"
                  className="h-auto max-h-72 w-full object-contain"
                />
              ) : (
                <div className="flex h-48 items-center justify-center bg-muted">
                  <p className="text-sm text-muted-foreground">No image</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-center sm:hidden">
          <Separator className="w-16" />
        </div>

        {/* Generated */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Generated</p>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {isGenerating ? (
                <Skeleton className="h-72 w-full" />
              ) : generatedImage ? (
                <img
                  src={`data:${generatedMimeType};base64,${generatedImage}`}
                  alt="Generated image"
                  className="h-auto max-h-72 w-full object-contain"
                />
              ) : (
                <div className="flex h-48 items-center justify-center bg-muted">
                  <p className="text-sm text-muted-foreground">
                    Click &quot;Generate&quot; to create
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
