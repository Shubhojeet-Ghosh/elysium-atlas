// components/Logo.jsx
import Link from "next/link";
import MiniLogo from "@/components/ElysiumAtlas/MiniLogo";

export default function Logo({ showMiniature = false }) {
  if (showMiniature) {
    return (
      <Link href={"/my-agents"}>
        <p className="font-mono text-[24px] font-semibold text-serene-purple align-super">
          a<span className="text-deep-onyx dark:text-pure-mist ">.</span>
        </p>
      </Link>
    );
  }

  return (
    <Link href={"/my-agents"} className="flex items-baseline font-mono">
      {/* You can add an icon here if you want */}
      <span className=" text-[24px] font-[500] text-deep-onyx dark:text-pure-mist tracking-tight">
        Elysium.
      </span>
      <sup className=" text-[18px] font-[600] text-serene-purple align-super">
        atlas
      </sup>
    </Link>
  );
}
