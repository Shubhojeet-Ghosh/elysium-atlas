import EmailRegisterDepartmentBox from "@/components/ElysiumAtlas/email/auth/EmailRegisterDepartmentBox";
import { emailRegisterDepartmentPageMetadata } from "./metadata";

export const metadata = emailRegisterDepartmentPageMetadata;

export default function EmailRegisterDepartmentPage() {
  return (
    <div className="flex items-center justify-center md:mt-[60px] mt-[40px] lg:px-[20px] px-0 pb-10">
      <EmailRegisterDepartmentBox />
    </div>
  );
}
