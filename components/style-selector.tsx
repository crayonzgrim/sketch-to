"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  STYLE_CATEGORIES,
  STYLE_OPTIONS,
  type StyleType,
} from "@/lib/prompts";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StyleSelectorProps {
  selectedStyle: StyleType | null;
  onStyleSelect: (style: StyleType) => void;
}

export function StyleSelector({
  selectedStyle,
  onStyleSelect,
}: StyleSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<
    "icon" | "illustration" | "design" | "character" | "artistic"
  >("icon");

  const filteredStyles = STYLE_OPTIONS.filter(
    (s) => s.category === activeCategory
  );

  return (
    <div className="space-y-4">
      {/* Category tabs - horizontal scroll on mobile, full width on desktop */}
      <div className="overflow-x-auto scrollbar-hide sm:overflow-x-visible -mx-1 px-1 sm:mx-0 sm:px-0">
        <div className="flex gap-1 rounded-lg bg-muted p-1 w-max sm:w-auto">
          {STYLE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "shrink-0 sm:flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeCategory === cat.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="block whitespace-nowrap">{cat.name}</span>
              <span className="block whitespace-nowrap text-[10px] font-normal opacity-60">
                {cat.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Style grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {filteredStyles.map((style) => {
          const isSelected = selectedStyle === style.id;

          return (
            <div key={style.id}>
              <Card
                className={cn(
                  "h-36 cursor-pointer transition-all hover:shadow-md",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "hover:border-primary/50"
                )}
                onClick={() => onStyleSelect(style.id)}
              >
                <CardContent className="relative flex h-full flex-col items-center justify-center gap-1.5 p-3">
                  <span
                    className="text-2xl"
                    role="img"
                    aria-label={style.name}
                  >
                    {style.emoji}
                  </span>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isSelected && "text-primary"
                    )}
                  >
                    {style.name}
                  </p>
                  <p className="text-center text-[11px] leading-tight text-muted-foreground">
                    {style.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}