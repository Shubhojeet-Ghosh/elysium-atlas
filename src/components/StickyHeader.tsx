import Link from "next/link";
import Logo from "@/components/ElysiumAtlas/LogoComponent";
import RemoveDarkMode from "@/components/RemoveDarkMode";

export default function StickyHeader() {
  return (
    <>
      <RemoveDarkMode />
      <nav
        className="flex flex-row items-center px-[22px] py-[14px] justify-between  fixed z-30 w-full"
        aria-label="Main navigation"
      >
        <Logo />
        <div className="flex flex-row gap-[16px] items-center justify-center">
          <div className="md:flex  flex-row gap-[16px] items-center justify-center  rounded-[8px]">
            <Link
              href="/auth/login"
              className="flex items-center justify-center px-[24px] py-[12px] text-[12px] rounded-full outline outline-serene-purple bg-white text-serene-purple font-semibold transition-all duration-200"
              aria-label="Sign in to your account"
            >
              <span>Sign in</span>
            </Link>
          </div>
          <div className="hidden md:flex  flex-row gap-[16px] items-center justify-center  rounded-[8px]">
            <Link
              href="/auth/login"
              className="flex items-center justify-center px-[24px] py-[12px] text-[12px] rounded-full bg-serene-purple hover:bg-serene-purple/80 text-white font-semibold transition-all duration-200"
              aria-label="Sign in to your account"
            >
              <span>Sign up</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
