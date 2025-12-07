import { Metadata } from "next";

export const homePageMetadata: Metadata = {
  title: "Elysium Atlas - Autonomous AI Agents for Enterprise",
  description:
    "Build, deploy, and monitor intelligent AI agents across websites and platforms. Enterprise-grade autonomous AI agent platform for modern businesses.",
  keywords: [
    "AI agents",
    "autonomous AI",
    "enterprise AI",
    "AI automation",
    "intelligent agents",
    "AI deployment",
    "AI monitoring",
    "artificial intelligence",
    "machine learning agents",
    "AI platform",
  ],
  authors: [{ name: "Elysium Atlas" }],
  creator: "Elysium Atlas",
  publisher: "Elysium Atlas",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://atlas.sgdevstudio.in"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Elysium Atlas - Autonomous AI Agents for Enterprise",
    description:
      "Build, deploy, and monitor intelligent AI agents across websites and platforms. Enterprise-grade autonomous AI agent platform.",
    url: "/",
    siteName: "Elysium Atlas",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg", // You should add an OG image
        width: 1200,
        height: 630,
        alt: "Elysium Atlas - Autonomous AI Agents for Enterprise",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elysium Atlas - Autonomous AI Agents for Enterprise",
    description:
      "Build, deploy, and monitor intelligent AI agents across websites and platforms.",
    images: ["/og-image.jpg"], // You should add a Twitter image
    creator: "@elysiumatlas", // Update with your Twitter handle
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
  verification: {
    // Add your verification codes when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
};
