"use client";

import { useLoginDialog } from "@/components/auth/login-dialog";
import { DownloadOptions } from "@/components/download-options";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ImagePreview } from "@/components/image-preview";
import { SketchCanvas } from "@/components/sketch-canvas";
import { SketchUploader } from "@/components/sketch-uploader";
import { StyleSelector } from "@/components/style-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { KakaoAdFit } from "@/components/ui/kakao-adfit";
import { Separator } from "@/components/ui/separator";
import { UsageIndicator } from "@/components/usage-indicator";
import { fileToBase64 } from "@/lib/image-utils";
import type { StyleType } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Upload, Wand2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Step = "upload" | "style" | "result";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleType | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedMimeType, setGeneratedMimeType] = useState("image/png");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageKey, setUsageKey] = useState(0);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ used: number; limit: number } | null>(null);
  const { openLoginDialog } = useLoginDialog();
  const router = useRouter();

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

    // Check if user is logged in
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      openLoginDialog();
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
          setLimitInfo({ used: data.used, limit: data.limit });
          setShowLimitDialog(true);
          setStep("style");
          return;
        }
        throw new Error(data.error || "Generation failed");
      }

      setGeneratedImage(data.image);
      setGeneratedMimeType(data.mimeType || "image/png");
      setUsageKey((prev) => prev + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsGenerating(false);
    }
  }, [imageFile, selectedStyle, customPrompt, openLoginDialog]);

  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleStartOver = useCallback(() => {
    handleClearImage();
  }, [handleClearImage]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* 카카오 애드핏 - 모바일 상단 배너 */}
      <div className="flex justify-center py-2 xl:hidden">
        <KakaoAdFit unit="DAN-PCgGvqo856JhQXWz" width={320} height={100} />
      </div>

      {/* 카카오 애드핏 - 데스크탑 좌측 사이드바 */}
      <div className="fixed left-4 top-1/2 z-20 hidden -translate-y-1/2 xl:block">
        <KakaoAdFit unit="DAN-QOp1St1jjkkenvVA" width={160} height={600} />
      </div>

      {/* 카카오 애드핏 - 데스크탑 우측 사이드바 */}
      <div className="fixed right-4 top-1/2 z-20 hidden -translate-y-1/2 xl:block">
        <KakaoAdFit unit="DAN-a3NsNEdvKBWNKd5I" width={160} height={600} />
      </div>

      <main className="container mx-auto max-w-3xl flex-1 px-4 py-8">
        {/* Usage indicator */}
        <div className="mb-4 flex justify-end">
          <UsageIndicator refreshKey={usageKey} />
        </div>

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
                className={`text-sm font-medium ${step === key
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

        {/* Step 1: Upload or Draw */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Your sketch</h2>
            <p className="text-sm text-muted-foreground">
              Upload an image or draw directly
            </p>
          </div>

          {imagePreview ? (
            <div className="relative overflow-hidden rounded-lg border">
              <img
                src={imagePreview}
                alt="Selected sketch"
                className="h-auto max-h-80 w-full object-contain"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleClearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="upload" className="flex-1 gap-1.5">
                  <Upload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="draw" className="flex-1 gap-1.5">
                  <Pencil className="h-4 w-4" />
                  Draw
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upload">
                <SketchUploader
                  onImageSelect={handleImageSelect}
                  selectedImage={null}
                  onClear={handleClearImage}
                />
              </TabsContent>
              <TabsContent value="draw">
                <SketchCanvas onImageSelect={handleImageSelect} />
              </TabsContent>
            </Tabs>
          )}
        </section>

        {/* Step 2: Style Selection */}
        {(step === "style" || step === "result") && imagePreview && (
          <>
            <Separator className="my-8" />
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Choose a style</h2>
                <p className="text-sm text-muted-foreground">
                  Select how you want your sketch transformed
                </p>
              </div>
              <StyleSelector
                selectedStyle={selectedStyle}
                onStyleSelect={handleStyleSelect}
              />
              {/* Custom prompt input */}
              <div className="space-y-2">
                <label
                  htmlFor="custom-prompt"
                  className="text-sm font-medium text-foreground"
                >
                  Additional instructions{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="custom-prompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Use blue and white colors, make it more rounded, add a shadow effect..."
                  className="resize-none w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                  maxLength={500}
                />
                {customPrompt.length > 0 && (
                  <p className="text-right text-xs text-muted-foreground">
                    {customPrompt.length}/500
                  </p>
                )}
              </div>
              {selectedStyle && step === "style" && (
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    <Wand2 className="mr-2 h-5 w-5" />
                    Generate Image
                  </Button>
                </div>
              )}
            </section>
          </>
        )}

        {/* Step 3: Result */}
        {step === "result" && (
          <>
            <Separator className="my-8" />
            <section className="space-y-6">
              <ImagePreview
                originalImage={imagePreview}
                generatedImage={generatedImage}
                generatedMimeType={generatedMimeType}
                isGenerating={isGenerating}
                onRegenerate={handleRegenerate}
              />

              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {generatedImage && (
                <DownloadOptions
                  generatedImage={generatedImage}
                  generatedMimeType={generatedMimeType}
                />
              )}

              <div className="flex justify-center">
                <Button variant="outline" onClick={handleStartOver}>
                  Start Over
                </Button>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />

      {/* Usage Limit Alert Dialog */}
      <AlertDialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Daily Limit Reached</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ve used all {limitInfo?.limit} generations for today
              ({limitInfo?.used}/{limitInfo?.limit}).
              Upgrade your plan to get more daily generations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/pricing")}>
              View Pricing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
