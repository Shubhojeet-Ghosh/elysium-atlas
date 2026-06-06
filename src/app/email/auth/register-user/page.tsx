import EmailRegisterUserBox from "@/components/ElysiumAtlas/email/auth/EmailRegisterUserBox";
import { emailRegisterUserPageMetadata } from "./metadata";

export const metadata = emailRegisterUserPageMetadata;

export default function EmailRegisterUserPage() {
  return (
    <div className="flex items-center justify-center md:mt-[60px] mt-[40px] lg:px-[20px] px-0 pb-10">
      <EmailRegisterUserBox />
    </div>
  );
}
