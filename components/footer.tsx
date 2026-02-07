"use client";

import { Separator } from "@/components/ui/separator";
import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/30">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium">SketchTo</p>
            <p className="text-xs text-muted-foreground">
              Transform rough sketches into professional images with AI.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Contact</p>
              <p className="text-xs text-muted-foreground">
                Feature requests &amp; inquiries welcome
              </p>

            </div>
            <a
              href="mailto:crayonzgrim@gmail.com"
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" />
              crayonzgrim@gmail.com
            </a>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} SketchTo. All rights reserved.</p>
          {/* <div className="flex gap-4"> */}
          {/* <a href="/terms" className="transition-colors hover:text-foreground"> */}
          {/*   Terms of Service */}
          {/* </a> */}
          {/* <a */}
          {/*   href="/privacy" */}
          {/*   className="transition-colors hover:text-foreground" */}
          {/* > */}
          {/*   Privacy Policy */}
          {/* </a> */}
          {/* </div> */}
        </div>
      </div>
    </footer>
  );
}
