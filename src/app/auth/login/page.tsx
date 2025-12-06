import LoginBox from "@/components/ElysiumAtlas/auth/LoginBox";
import Logo from "@/components/ElysiumAtlas/LogoComponent";
import ThemeToggle from "@/components/ElysiumAtlas/ThemeToggle";
import { loginPageMetadata } from "./metadata";

export const metadata = loginPageMetadata;

export default function ElysiumAtlasAuthPage() {
  return (
    <>
      <div className="flex flex-row items-center justify-between w-full px-[18px] py-[10px]">
        <Logo />
        <ThemeToggle />
      </div>
      <div className="flex items-center justify-center md:mt-[100px] mt-[60px] lg:px-[20px] px-0">
        <LoginBox />
      </div>
    </>
  );
}
