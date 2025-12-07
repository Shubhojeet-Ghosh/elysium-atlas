import { ReactNode } from "react";
import BackgroundImage from "@/components/BackgroundImage";

interface ElysiumImageCompProps {
  children?: ReactNode;
}

export default function ElysiumImageComp({ children }: ElysiumImageCompProps) {
  return (
    <div className="relative h-screen w-full z-10">
      <BackgroundImage />
      {children && <div className="absolute inset-0 z-20">{children}</div>}
    </div>
  );
}
