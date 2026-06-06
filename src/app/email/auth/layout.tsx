import EmailLogo from "@/components/ElysiumAtlas/email/EmailLogo";

export default function EmailAuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="flex flex-row items-center w-full px-[18px] py-[10px] bg-white">
        <EmailLogo href="/email/auth/login" />
      </div>
      {children}
    </>
  );
}
