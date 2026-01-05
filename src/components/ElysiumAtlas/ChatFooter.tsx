"use client";

import { useAppSelector } from "@/store";
import Link from "next/link";

export default function ChatFooter() {
  const { primary_color, secondary_color, text_color } = useAppSelector(
    (state) => state.agentChat
  );

  return (
    <div
      className="flex justify-center lg:rounded-b-[16px] md:rounded-b-none rounded-b-none py-[8px] border-t border-gray-100"
      style={{ backgroundColor: primary_color }}
    >
      <span
        className="flex items-center justify-center text-[12px] text-gray-400 font-medium "
        style={{ color: text_color }}
      >
        Powered by{" "}
        <Link href="https://atlas.sgdevstudio.in/" target="_blank">
          <span className="flex items-baseline font-mono  ml-[4px]">
            <span className="text-[12px] font-[500] tracking-tight">
              Elysium.
            </span>
            <sup className="text-[10px] font-[600] text-serene-purple align-super">
              atlas
            </sup>
          </span>
        </Link>
      </span>
    </div>
  );
}
