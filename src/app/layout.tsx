import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ReduxProviderWrapper from "@/components/ReduxProviderWrapper";
import NProgressProvider from "@/components/NProgressProvider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Elysium Atlas",
  description: "Platform for building and managing AI Agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${manrope.variable} antialiased`}
      >
        <ReduxProviderWrapper>
          <NProgressProvider>{children}</NProgressProvider>
        </ReduxProviderWrapper>
        <Toaster />
      </body>
    </html>
  );
}
