"use client";

import AgentAvatar from "./AgentAvatar";

interface AgentPersonalityProps {
  avatarFile: File | null;
  setAvatarFile: (file: File | null) => void;
  clearSignal: number;
}

export default function AgentPersonality({
  avatarFile,
  setAvatarFile,
  clearSignal,
}: AgentPersonalityProps) {
  return (
    <div className="flex flex-col lg:px-[40px] px-0 lg:mt-[40px] mt-[20px] gap-[30px]">
      <AgentAvatar
        avatarFile={avatarFile}
        setAvatarFile={setAvatarFile}
        clearSignal={clearSignal}
      />
    </div>
  );
}
