import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function HeroSection() {
  return (
    <header className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
      {/* Announcement Bar */}
      <aside
        className="mb-6 px-4 py-2 rounded-full bg-gray-100 backdrop-blur-sm border border-gray-200"
        aria-label="Announcement"
      >
        <Link
          href="/auth/login"
          className="group flex items-center gap-2 text-deep-onyx text-[13px] font-medium cursor-pointer"
          aria-label="Learn more about building AI agents"
        >
          <span>Build your agent in minutes.</span>
          <span aria-hidden="true">
            <ChevronRight
              size={14}
              className="group-hover:text-gray-400 transition-all duration-200"
            />
          </span>
        </Link>
      </aside>

      {/* Main Headline */}
      <h1 className="text-[32px] md:text-[60px] lg:text-[72px] font-serif text-deep-onyx mb-4 leading-tight max-w-4xl">
        <span className="block">Autonomous AI agents</span>
        <span className="block">for your website..</span>
      </h1>

      {/* Sub-headline */}
      <p className="text-[16px] md:text-[24px] text-deep-onyx/80 mb-8 max-w-2xl font-mono">
        Build once. Deploy on your website. Monitor everything.
      </p>

      {/* Call-to-Action Button */}
      <Link
        href="/auth/login"
        className="px-8 py-4 text-[14px] rounded-full bg-serene-purple text-white font-semibold text-base hover:bg-serene-purple/80 transition-all duration-200"
        aria-label="Get started with Elysium Atlas"
      >
        Get Started
      </Link>
    </header>
  );
}
