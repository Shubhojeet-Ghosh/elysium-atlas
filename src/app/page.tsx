import ElysiumImageComp from "@/components/ElysiumImageComp";
import StickyHeader from "@/components/StickyHeader";
import HeroSection from "@/components/HeroSection";
import StructuredData from "@/components/SEO/StructuredData";
import { homePageMetadata } from "@/components/SEO/metadata";
import { homePageStructuredData } from "@/components/SEO/structuredDataConfig";

// Export metadata for Next.js
export const metadata = homePageMetadata;

export default function Home() {
  return (
    <>
      {/* Structured Data for SEO */}
      <StructuredData data={homePageStructuredData} />

      <div className="text-deep-onyx">
        {/* Sticky header - stays at top throughout scroll */}
        <StickyHeader />

        {/* Main content area */}
        <main>
          {/* Hero section with image background */}
          <section aria-label="Hero section">
            <ElysiumImageComp>
              <HeroSection />
            </ElysiumImageComp>
          </section>

          {/* Additional content sections can be added here */}
          <div className="relative z-20 bg-transparent text-deep-onyx"></div>
        </main>
      </div>
    </>
  );
}
