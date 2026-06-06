import Link from "next/link";
import Image from "next/image";
import { emailConfig } from "@/lib/emailConfig";

interface EmailLogoProps {
  href?: string;
  className?: string;
  imageClassName?: string;
}

export default function EmailLogo({
  href = "/email",
  className = "",
  imageClassName = "h-12 w-auto",
}: EmailLogoProps) {
  return (
    <Link href={href} className={`inline-flex items-center ${className}`}>
      <Image
        src={emailConfig.logo.main}
        alt="Orvera"
        width={168}
        height={48}
        unoptimized
        priority
        className={imageClassName}
      />
    </Link>
  );
}
