"use client";

export default function AgentWelcomeMessageLeft() {
  return (
    <div className="lg:w-[40%] w-full flex flex-col gap-[8px] p-[24px] pb-0 lg:pb-[24px]">
      <p className="text-[16px] font-[600]">Welcome Message</p>
      <p className="text-[13px] text-muted-foreground">
        Set the greeting message your agent shows when a visitor opens the chat.
        Make it friendly, welcoming, and engaging.
      </p>
    </div>
  );
}
