import ThemeToggle from "@/components/ElysiumAtlas/ThemeToggle";
import Image from "next/image";
import Logo from "@/components/ElysiumAtlas/LogoComponent";

export default function MyAgentsPage() {
  return (
    <>
      <div className="flex flex-col w-full h-[100dvh] bg-pure-mist dark:bg-deep-onyx">
        <div className="flex flex-row items-center justify-between w-full px-[18px] py-[10px]">
          <Logo />
          <ThemeToggle showIcon={false} />
        </div>
      </div>
    </>
  );
}
