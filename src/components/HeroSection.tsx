import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function HeroSection() {
  return (
    <header className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
      {/* Announcement Bar */}
      <aside
        className="mb-6 px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/10"
        aria-label="Announcement"
      >
        <Link
          href="/auth/login"
          className="group flex items-center gap-2 text-white text-[13px] font-medium cursor-pointer"
          aria-label="Learn more about building AI agents"
        >
          <span>Build AI agents for websites, files, and more</span>
          <span aria-hidden="true">
            <ChevronRight
              size={14}
              className="group-hover:text-deep-onyx transition-all duration-200"
            />
          </span>
        </Link>
      </aside>

      {/* Main Headline */}
      <h1 className="text-[48px] md:text-[60px] lg:text-[72px] font-serif text-white mb-4 leading-tight max-w-4xl">
        <span className="block">Autonomous AI agents</span>
        <span className="block">for enterprise.</span>
      </h1>

      {/* Sub-headline */}
      <p className="text-[20px] md:text-[24px] text-white/90 mb-8 max-w-2xl font-mono">
        Build, deploy, and monitor intelligent agents across websites and
        platforms
      </p>

      {/* Call-to-Action Button */}
      <Link
        href="/auth/login"
        className="px-8 py-4 text-[14px] rounded-full bg-white text-deep-onyx font-semibold text-base hover:bg-deep-onyx hover:text-white transition-all duration-200"
        aria-label="Get started with Elysium Atlas"
      >
        Get Started
      </Link>
    </header>
  );
}
