import ForgotPasswordBox from "@/components/ElysiumAtlas/auth/ForgotPasswordBox";
import Logo from "@/components/ElysiumAtlas/LogoComponent";
import ThemeToggle from "@/components/ElysiumAtlas/ThemeToggle";
import { forgotPasswordPageMetadata } from "./metadata";

export const metadata = forgotPasswordPageMetadata;

interface ForgotPasswordPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const { email } = await searchParams;

  return (
    <>
      <div className="flex flex-row items-center justify-between w-full px-[18px] py-[10px]">
        <Logo />
        <ThemeToggle />
      </div>
      <div className="flex items-center justify-center md:mt-[100px] mt-[60px] lg:px-[20px] px-0">
        <ForgotPasswordBox initialEmail={email ?? ""} />
      </div>
    </>
  );
}
