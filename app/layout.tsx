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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sketch-to.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "SketchTo - Sketch to Professional Image",
    template: "%s | SketchTo",
  },
  description:
    "Transform rough sketches into professional 2D images with AI. Upload your drawing and choose from flat icons, line art, 3D isometric, and more styles.",
  keywords: [
    "sketch to image",
    "AI image generator",
    "sketch converter",
    "drawing to icon",
    "flat icon generator",
    "line art converter",
    "3D isometric",
    "AI art",
    "image transformation",
    "스케치 변환",
    "AI 이미지 생성",
    "아이콘 생성기",
  ],
  authors: [{ name: "SketchTo" }],
  creator: "SketchTo",
  publisher: "SketchTo",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      ko: "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "ko_KR",
    url: siteUrl,
    siteName: "SketchTo",
    title: "SketchTo - Sketch to Professional Image",
    description:
      "Transform rough sketches into professional 2D images with AI. Upload your drawing and choose from flat icons, line art, 3D isometric, and more styles.",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "SketchTo - Transform sketches into professional images with AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SketchTo - Sketch to Professional Image",
    description:
      "Transform rough sketches into professional 2D images with AI.",
    images: [`${siteUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  // verification: {
  //   google: "your-google-verification-code",
  //   other: {
  //     "naver-site-verification": "your-naver-verification-code",
  //   },
  // },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SketchTo",
  description:
    "Transform rough sketches into professional 2D images with AI. Upload your drawing and choose from flat icons, line art, 3D isometric, and more styles.",
  url: siteUrl,
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  inLanguage: ["en", "ko"],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free tier available",
  },
  creator: {
    "@type": "Organization",
    name: "SketchTo",
    url: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LoginDialogProvider>{children}</LoginDialogProvider>
      </body>
    </html>
  );
}
