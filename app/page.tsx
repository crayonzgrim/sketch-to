"use client";

import { DownloadOptions } from "@/components/download-options";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ImagePreview } from "@/components/image-preview";
import { SketchCanvas } from "@/components/sketch-canvas";
import { SketchUploader } from "@/components/sketch-uploader";
import { StyleSelector } from "@/components/style-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { KakaoAdFit } from "@/components/ui/kakao-adfit";
import { Separator } from "@/components/ui/separator";
import { fileToBase64 } from "@/lib/image-utils";
import type { StyleType } from "@/lib/prompts";
import { Pencil, Upload, Wand2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Step = "upload" | "style" | "result";

export default function Home() {
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleType | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedMimeType, setGeneratedMimeType] = useState("image/png");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [showSignInDialog, setShowSignInDialog] = useState(false);

  const handleImageSelect = useCallback((file: File, preview: string) => {
    setImageFile(file);
    setImagePreview(preview);
    setGeneratedImage(null);
    setError(null);
    setStep("style");
  }, []);

  const handleClearImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setSelectedStyle(null);
    setCustomPrompt("");
    setGeneratedImage(null);
    setError(null);
    setStep("upload");
  }, []);

  const handleStyleSelect = useCallback((style: StyleType) => {
    setSelectedStyle(style);
    setError(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!imageFile || !selectedStyle) return;

    if (!session?.user?.id) {
      setShowSignInDialog(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setStep("result");

    try {
      const base64 = await fileToBase64(imageFile);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: imageFile.type,
          style: selectedStyle,
          customPrompt: customPrompt.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (response.status === 429) {
          setShowLimitDialog(true);
          setStep("style");
          return;
        }
        throw new Error(data.error || "Generation failed");
      }

      setGeneratedImage(data.image);
      setGeneratedMimeType(data.mimeType || "image/png");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setStep("style");
    } finally {
      setIsGenerating(false);
    }
  }, [imageFile, selectedStyle, customPrompt]);

  const handleReset = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setSelectedStyle(null);
    setCustomPrompt("");
    setGeneratedImage(null);
    setGeneratedMimeType("image/png");
    setError(null);
    setStep("upload");
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* 고정 广告 - 데스크탑 상단 */}
      <div className="fixed top-14 left-0 right-0 z-10 border-b bg-background/95 backdrop-blur xl:top-0">
        <div className="mx-auto max-w-[970px] py-1">
          <KakaoAdFit unit="DAN-Zky7O6GRyC8C1dm" width={970} height={50} />
        </div>
      </div>

      {/* 카카오 애드핏 - 데스크탑 우측 사이드바 */}
      <div className="fixed right-4 top-1/2 z-20 hidden -translate-y-1/2 xl:block">
        <KakaoAdFit unit="DAN-a3NsNEdvKBWNKd5I" width={160} height={600} />
      </div>

      <main className="container mx-auto max-w-3xl flex-1 px-4 py-8">
        {/* Step indicators */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[
            { key: "upload", label: "1. Upload" },
            { key: "style", label: "2. Style" },
            { key: "result", label: "3. Result" },
          ].map(({ key, label }, i) => (
            <div key={key} className="flex items-center gap-2">
              {i > 0 && <div className="h-px w-8 bg-border" />}
              <span
                className={`text-sm font-medium ${
                  step === key
                    ? "text-primary"
                    : (key === "style" && step === "result") ||
                        (key === "upload" &&
                          (step === "style" || step === "result"))
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {step === "upload" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                Create Your Sketch
              </h2>
              <p className="mt-2 text-muted-foreground">
                Upload an image or draw directly to transform it into a professional design
              </p>
            </div>

            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="draw" className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Draw
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <SketchUploader
                  onImageSelect={handleImageSelect}
                  selectedImage={imagePreview}
                  onClear={handleClearImage}
                />
              </TabsContent>

              <TabsContent value="draw" className="space-y-4">
                <SketchCanvas onImageSelect={handleImageSelect} />
              </TabsContent>
            </Tabs>

            {imagePreview && (
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="cursor-pointer"
                  onClick={() => setStep("style")}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Continue to Style Selection
                </Button>
              </div>
            )}
          </div>
        )}

        {step === "style" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                Choose a Style
              </h2>
              <p className="mt-2 text-muted-foreground">
                Select the style for your generated image
              </p>
            </div>

            {imagePreview && (
              <ImagePreview
                image={imagePreview}
                onClear={handleClearImage}
              />
            )}

            <StyleSelector
              selectedStyle={selectedStyle}
              onStyleSelect={handleStyleSelect}
            />

            <div className="space-y-2">
              <label htmlFor="custom-prompt" className="text-sm font-medium">
                Custom Prompt (optional)
              </label>
              <textarea
                id="custom-prompt"
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Add additional instructions for the image generation..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {customPrompt.length}/500
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setStep("upload")}
              >
                <Upload className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                className="flex-1 cursor-pointer"
                disabled={!selectedStyle || isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin mr-2">&#9203;</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                {error}
              </div>
            )}
          </div>
        )}

        {step === "result" && (
          <div className="space-y-8">
            {generatedImage && (
              <ImagePreview
                image={`data:${generatedMimeType};base64,${generatedImage}`}
                onClear={handleReset}
              />
            )}

            {generatedImage && (
              <DownloadOptions
                image={generatedImage}
                mimeType={generatedMimeType}
              />
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => {
                  setGeneratedImage(null);
                  setStep("style");
                }}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Change Style
              </Button>
              <Button
                className="cursor-pointer"
                disabled={isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin mr-2">&#9203;</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Regenerate
                  </>
                )}
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="link"
                className="cursor-pointer"
                onClick={handleReset}
              >
                <X className="mr-2 h-4 w-4" />
                Start Over
              </Button>
            </div>
          </div>
        )}
      </main>

      <AlertDialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Daily Limit Reached</AlertDialogTitle>
          <AlertDialogDescription>
            You have reached your daily limit of 3 image generations. Please try again tomorrow.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Close</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Sign in required</AlertDialogTitle>
          <AlertDialogDescription>
            Sign in to generate your image. You get 3 free generations per day.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => signIn("github")}>
              Sign in with GitHub
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}