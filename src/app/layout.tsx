import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";

import { brand } from "@/lib/brand";
import { clientEnv } from "@/lib/env";

import "./globals.css";

/**
 * Fonts are downloaded at build time and served from our own origin, so there
 * is no render-blocking request to a third-party font CDN and no CSP hole.
 * `display: swap` keeps text visible during load rather than flashing blank.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${brand.name} - ${brand.tagline}`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  keywords: [
    "DevOps course Sri Lanka",
    "cloud computing course Sri Lanka",
    "AWS course Sri Lanka",
    "after A/L IT courses",
    "software engineering Sri Lanka",
    "online IT courses Sri Lanka",
  ],
  authors: [{ name: brand.name }],
  openGraph: {
    type: "website",
    locale: brand.locale,
    siteName: brand.name,
    title: `${brand.name} - ${brand.tagline}`,
    description: brand.description,
    url: clientEnv.NEXT_PUBLIC_SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.name} - ${brand.tagline}`,
    description: brand.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#0e5c57",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-LK"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
