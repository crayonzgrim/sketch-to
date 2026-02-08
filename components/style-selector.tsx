"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  STYLE_CATEGORIES,
  STYLE_OPTIONS,
  type StyleType,
} from "@/lib/prompts";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

const ADMIN_EMAIL = "cappu159@gmail.com";

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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
        const { data } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single();
        setUserPlan(data?.plan ?? "free");
      }
    };
    fetchUser();
  }, []);

  const isAdmin = userEmail === ADMIN_EMAIL;
  const hasPaidPlan = userPlan !== "free";

  const filteredStyles = STYLE_OPTIONS.filter(
    (s) => s.category === activeCategory
  );

  const isStyleAccessible = (tier: "free" | "pro") => {
    if (isAdmin) return true;
    if (hasPaidPlan) return true;
    return tier === "free";
  };

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
            <span className="block text-[10px] font-normal opacity-60">
              {cat.description}
            </span>
          </button>
        ))}
      </div>

      {/* Style grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {filteredStyles.map((style) => {
          const isSelected = selectedStyle === style.id;
          const accessible = isStyleAccessible(style.tier);

          return (
            <div key={style.id} className="group relative">
              <Card
                className={cn(
                  "h-36 transition-all",
                  accessible
                    ? "cursor-pointer hover:shadow-md"
                    : "cursor-not-allowed opacity-50",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : accessible
                      ? "hover:border-primary/50"
                      : ""
                )}
                onClick={() => {
                  if (accessible) onStyleSelect(style.id);
                }}
              >
                <CardContent className="relative flex h-full flex-col items-center justify-center gap-1.5 p-3">
                  {!accessible && (
                    <>
                      <span className="absolute left-3 -top-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        PRO
                      </span>
                      <div className="absolute right-3 -top-1">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </>
                  )}
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

              {/* Hover tooltip for locked styles */}
              {!accessible && (
                <div className="pointer-events-none absolute -top-10 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-3 py-1.5 text-xs text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  Upgrade to PRO to unlock this style
                  <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-foreground" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
