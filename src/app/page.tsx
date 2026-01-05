import StickyHeader from "@/components/StickyHeader";
import HeroSection from "@/components/HeroSection";
import StructuredData from "@/components/SEO/StructuredData";
import { homePageMetadata } from "@/components/SEO/metadata";
import { homePageStructuredData } from "@/components/SEO/structuredDataConfig";
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern";
import { cn } from "@/lib/utils";
import RemoveDarkMode from "@/components/RemoveDarkMode";
import Script from "next/script";

// Export metadata for Next.js
export const metadata = homePageMetadata;

export default function Home() {
  return (
    <>
      {/* Remove dark mode */}
      <RemoveDarkMode />

      {/* Structured Data for SEO */}
      <StructuredData data={homePageStructuredData} />

      <div className="text-deep-onyx">
        {/* Sticky header - stays at top throughout scroll */}
        <StickyHeader />

        {/* Main content area */}
        <main>
          {/* Hero section with grid pattern background */}
          <section
            aria-label="Hero section"
            className="relative h-screen w-full overflow-hidden bg-white"
          >
            <div className="absolute inset-0">
              <GridPattern
                squares={[
                  [4, 4],
                  [5, 1],
                  [8, 2],
                  [5, 3],
                  [5, 5],
                  [10, 10],
                  [12, 15],
                  [15, 10],
                  [10, 15],
                  [15, 10],
                  [10, 15],
                  [15, 10],
                ]}
                className={cn(
                  "mask-[radial-gradient(400px_circle_at_center,white,transparent)]",
                  "inset-x-0 top-[-40%] h-[200%] skew-y-12"
                )}
              />
            </div>
            <HeroSection />
          </section>

          {/* Additional content sections can be added here */}
          <div className="relative z-20 bg-transparent text-deep-onyx"></div>
        </main>
      </div>
      <Script
        src="https://cdn.sgdevstudio.in/widget/v0.0.3/widget.js?agent_id=695c3cd289c5797e0f344593"
        strategy="afterInteractive"
      />
    </>
  );
}
