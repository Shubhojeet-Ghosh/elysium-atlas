"use client";

export default function AgentColorsLeft() {
  return (
    <div className="lg:w-[40%] w-full flex flex-col gap-[8px] p-[24px] pb-0 lg:pb-[24px]">
      <p className="text-[16px] font-[600]">Colors</p>
      <p className="text-[13px] text-muted-foreground">
        Customise your agent&apos;s color scheme. These colors are applied to
        the chat widget and embedded interfaces to match your brand.
      </p>
    </div>
  );
}
