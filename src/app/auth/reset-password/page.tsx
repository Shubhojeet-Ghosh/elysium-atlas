import ResetPasswordBox from "@/components/ElysiumAtlas/auth/ResetPasswordBox";
import Logo from "@/components/ElysiumAtlas/LogoComponent";
import ThemeToggle from "@/components/ElysiumAtlas/ThemeToggle";
import { resetPasswordPageMetadata } from "./metadata";

export const metadata = resetPasswordPageMetadata;

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <>
      <div className="flex flex-row items-center justify-between w-full px-[18px] py-[10px]">
        <Logo />
        <ThemeToggle />
      </div>
      <div className="flex items-center justify-center md:mt-[100px] mt-[60px] lg:px-[20px] px-0">
        <ResetPasswordBox token={token ?? null} />
      </div>
    </>
  );
}
