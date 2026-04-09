"use client";

import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
  image: string;
  onClear: () => void;
}

export function ImagePreview({ image, onClear }: ImagePreviewProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Preview</p>
      <Card className="overflow-hidden relative">
        <CardContent className="p-0">
          <img
            src={image}
            alt="Preview"
            className="h-auto max-h-72 w-full object-contain"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}