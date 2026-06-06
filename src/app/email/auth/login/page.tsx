import EmailLoginBox from "@/components/ElysiumAtlas/email/auth/EmailLoginBox";
import { emailLoginPageMetadata } from "./metadata";

export const metadata = emailLoginPageMetadata;

export default function EmailAuthLoginPage() {
  return (
    <div className="flex items-center justify-center md:mt-[100px] mt-[60px] lg:px-[20px] px-0">
      <EmailLoginBox />
    </div>
  );
}