"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Sign in to SketchTo</h1>
            <p className="mt-2 text-muted-foreground">
              Sign in with your GitHub account to get started
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => signIn("github", { callbackUrl: "/" })}
              size="lg"
              variant="outline"
              className="w-full gap-2"
            >
              <Github className="h-5 w-5" />
              Sign in with GitHub
            </Button>

            <Button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              size="lg"
              variant="outline"
              className="w-full gap-2"
            >
              G
              Sign in with Google
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          <div className="space-y-3 rounded-lg bg-muted p-4">
            <h3 className="font-semibold">Free tier includes:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                3 image generations per day
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                All style options available
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                High quality output
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
