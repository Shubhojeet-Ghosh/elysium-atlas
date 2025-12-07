import Image from "next/image";
import { config } from "@/lib/config";

export default function BackgroundImage() {
  return (
    <div className="absolute inset-0 h-full w-full">
      <Image
        src={config.images.background.elysium}
        alt="Elysium Atlas Background"
        fill
        priority
        quality={100}
        className="object-cover"
        sizes="100vw"
      />
    </div>
  );
}
