import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LoginDialogProvider } from "@/components/auth/login-dialog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SketchTo - Sketch to Professional Image",
  description:
    "Transform rough sketches into professional 2D images with AI. Upload your drawing and choose from flat icons, line art, 3D isometric, and more styles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LoginDialogProvider>{children}</LoginDialogProvider>
      </body>
    </html>
  );
}
