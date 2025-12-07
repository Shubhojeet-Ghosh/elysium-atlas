import Link from "next/link";
import Logo from "@/components/ElysiumAtlas/LogoComponent";
import RemoveDarkMode from "@/components/RemoveDarkMode";

export default function StickyHeader() {
  return (
    <>
      <RemoveDarkMode />
      <nav
        className="flex flex-row px-[20px] justify-between top-[30px] fixed z-30 w-full"
        aria-label="Main navigation"
      >
        <div className="px-[24px] py-[12px] rounded-[8px] bg-white/10 backdrop-blur-md shadow-lg">
          <Logo />
        </div>

        <div className="hidden md:flex px-[24px] flex-row gap-[16px] items-center justify-center py-[12px] rounded-[8px]">
          <Link
            href="/auth/login"
            className="flex items-center justify-center px-[24px] py-[12px] text-[12px] rounded-full bg-white text-deep-onyx font-semibold hover:bg-deep-onyx hover:text-white transition-all duration-200"
            aria-label="Sign in to your account"
          >
            <span>Sign in</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
