import EmailTopNav from "@/components/ElysiumAtlas/email/EmailTopNav";
import EmailLeftNav from "@/components/ElysiumAtlas/email/EmailLeftNav";
import EmailPageContent from "@/components/ElysiumAtlas/email/EmailPageContent";

export default function EmailAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <EmailTopNav />
      <EmailLeftNav />
      <EmailPageContent>{children}</EmailPageContent>
    </>
  );
}
