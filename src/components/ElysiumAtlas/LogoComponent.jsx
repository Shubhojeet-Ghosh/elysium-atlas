// components/Logo.jsx
import Link from "next/link";

export default function Logo() {
  return (
    <Link href={"/auth/login"} className="flex items-baseline font-mono">
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
