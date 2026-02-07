"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

interface SketchUploaderProps {
  onImageSelect: (file: File, preview: string) => void;
  selectedImage: string | null;
  onClear: () => void;
}

export function SketchUploader({
  onImageSelect,
  selectedImage,
  onClear,
}: SketchUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Unsupported file type. Use PNG, JPG, WebP, or GIF.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File too large. Maximum size is 4MB.";
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = () => {
        onImageSelect(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (selectedImage) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="relative p-0">
          <img
            src={selectedImage}
            alt="Uploaded sketch"
            className="h-auto max-h-80 w-full object-contain"
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
    );
  }

  return (
    <div>
      <Card
        className={cn(
          "cursor-pointer border-2 border-dashed transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
          <div
            className={cn(
              "rounded-full p-4 transition-colors",
              isDragging ? "bg-primary/10" : "bg-muted"
            )}
          >
            {isDragging ? (
              <ImageIcon className="h-8 w-8 text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            <p className="font-medium">
              {isDragging
                ? "Drop your sketch here"
                : "Drag & drop your sketch"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              or click to browse. PNG, JPG, WebP, GIF up to 4MB
            </p>
          </div>
        </CardContent>
      </Card>
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
