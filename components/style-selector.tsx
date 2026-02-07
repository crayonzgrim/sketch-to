"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  STYLE_OPTIONS,
  STYLE_CATEGORIES,
  type StyleType,
} from "@/lib/prompts";

interface StyleSelectorProps {
  selectedStyle: StyleType | null;
  onStyleSelect: (style: StyleType) => void;
}

export function StyleSelector({
  selectedStyle,
  onStyleSelect,
}: StyleSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<
    "icon" | "illustration" | "design"
  >("icon");

  const filteredStyles = STYLE_OPTIONS.filter(
    (s) => s.category === activeCategory
  );

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {STYLE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeCategory === cat.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="block">{cat.name}</span>
            <span className="block text-[11px] font-normal opacity-60">
              {cat.description}
            </span>
          </button>
        ))}
      </div>

      {/* Style grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {filteredStyles.map((style) => {
          const isSelected = selectedStyle === style.id;

          return (
            <Card
              key={style.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : "hover:border-primary/50"
              )}
              onClick={() => onStyleSelect(style.id)}
            >
              <CardContent className="flex flex-col items-center gap-1.5 p-3">
                <span className="text-2xl" role="img" aria-label={style.name}>
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
          );
        })}
      </div>
    </div>
  );
}
