"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Pen, Redo2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SketchCanvasProps {
  onImageSelect: (file: File, preview: string) => void;
}

const COLOR_PRESETS = [
  "#000000",
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
];

const MAX_UNDO_STACK = 30;

export function SketchCanvas({ onImageSelect }: SketchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [canvasReady, setCanvasReady] = useState(false);

  // Track last point for smooth lines
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const getCanvasSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { width: 400, height: 400 };
    const width = container.clientWidth;
    const height = Math.min(400, Math.round(width * 0.75));
    return { width, height };
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = getCanvasSize();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    setUndoStack([]);
    setCanvasReady(true);
  }, [getCanvasSize]);

  // Initialize canvas
  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // ResizeObserver to handle container resize
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(() => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Save current content
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const oldWidth = canvas.width;
      const oldHeight = canvas.height;

      const { width, height } = getCanvasSize();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Restore content at original scale
      if (oldWidth > 0 && oldHeight > 0) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = oldWidth;
        tempCanvas.height = oldHeight;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.putImageData(imageData, 0, 0);
          ctx.drawImage(
            tempCanvas,
            0,
            0,
            oldWidth / (window.devicePixelRatio || 1),
            oldHeight / (window.devicePixelRatio || 1)
          );
        }
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [getCanvasSize]);

  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack((prev) => {
      const next = [...prev, snapshot];
      if (next.length > MAX_UNDO_STACK) next.shift();
      return next;
    });
  }, []);

  const getPos = useCallback(
    (e: MouseEvent | Touch) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const startDraw = useCallback(
    (pos: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      saveSnapshot();
      setIsDrawing(true);
      lastPoint.current = pos;

      ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      ctx.lineWidth = tool === "eraser" ? brushSize * 3 : brushSize;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    },
    [tool, color, brushSize, saveSnapshot]
  );

  const draw = useCallback(
    (pos: { x: number; y: number }) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const prev = lastPoint.current;
      if (!prev) return;

      ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      ctx.lineWidth = tool === "eraser" ? brushSize * 3 : brushSize;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      lastPoint.current = pos;
    },
    [isDrawing, tool, color, brushSize]
  );

  const endDraw = useCallback(() => {
    setIsDrawing(false);
    lastPoint.current = null;
  }, []);

  // Mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      startDraw(getPos(e.nativeEvent));
    },
    [startDraw, getPos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      draw(getPos(e.nativeEvent));
    },
    [draw, getPos]
  );

  const handleMouseUp = useCallback(() => {
    endDraw();
  }, [endDraw]);

  // Touch events via useEffect for passive:false
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) startDraw(getPos(touch));
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) draw(getPos(touch));
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      endDraw();
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [startDraw, draw, endDraw, getPos]);

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || undoStack.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prev = undoStack[undoStack.length - 1];
    ctx.putImageData(prev, 0, 0);
    setUndoStack((s) => s.slice(0, -1));
  }, [undoStack]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    saveSnapshot();
    const { width, height } = getCanvasSize();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }, [saveSnapshot, getCanvasSize]);

  const handleUseSketch = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preview = canvas.toDataURL("image/png");
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "sketch.png", { type: "image/png" });
      onImageSelect(file, preview);
    }, "image/png");
  }, [onImageSelect]);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Tools */}
        <div className="flex gap-1">
          <Button
            variant={tool === "pen" ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setTool("pen")}
            title="Pen"
          >
            <Pen className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "eraser" ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setTool("eraser")}
            title="Eraser"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Color presets */}
        <div className="flex items-center gap-1">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-transform",
                color === c && tool === "pen"
                  ? "scale-110 border-foreground"
                  : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: c }}
              onClick={() => {
                setColor(c);
                setTool("pen");
              }}
              title={c}
            />
          ))}
          <label className="relative h-6 w-6 cursor-pointer">
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setTool("pen");
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <div
              className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/50"
              style={{
                background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`,
              }}
              title="Custom color"
            />
          </label>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Brush size */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {brushSize}px
          </span>
          <input
            type="range"
            min={1}
            max={20}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="h-1.5 w-20 cursor-pointer accent-primary"
          />
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Undo & Clear */}
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title="Undo"
          >
            <Redo2 className="h-4 w-4 -scale-x-100" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleClear}
            title="Clear"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-lg border bg-white"
      >
        <canvas
          ref={canvasRef}
          className="block w-full cursor-crosshair"
          style={{ touchAction: "none" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Use This Sketch button */}
      <div className="flex justify-center">
        <Button onClick={handleUseSketch} disabled={!canvasReady}>
          Use This Sketch
        </Button>
      </div>
    </div>
  );
}
