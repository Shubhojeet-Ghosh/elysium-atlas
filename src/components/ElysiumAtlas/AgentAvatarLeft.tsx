"use client";

export default function AgentAvatarLeft() {
  return (
    <div className="lg:w-[40%] w-full flex flex-col gap-[8px] p-[24px] pb-0 lg:pb-[24px]">
      <p className="text-[16px] font-[600]">Avatar</p>
      <p className="text-[13px] text-muted-foreground">
        Set the avatar of your agent. This image will be displayed in the chat
        widget and across the platform.
      </p>
    </div>
  );
}
