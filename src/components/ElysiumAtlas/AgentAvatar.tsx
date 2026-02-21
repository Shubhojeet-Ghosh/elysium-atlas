"use client";

import AgentAvatarLeft from "./AgentAvatarLeft";
import AgentAvatarRight from "./AgentAvatarRight";

interface AgentAvatarProps {
  avatarFile: File | null;
  setAvatarFile: (file: File | null) => void;
  clearSignal: number;
}

export default function AgentAvatar({
  avatarFile,
  setAvatarFile,
  clearSignal,
}: AgentAvatarProps) {
  return (
    <div className="flex lg:flex-row flex-col w-full border-b border-border overflow-hidden">
      <AgentAvatarLeft />
      <AgentAvatarRight
        avatarFile={avatarFile}
        setAvatarFile={setAvatarFile}
        clearSignal={clearSignal}
      />
    </div>
  );
}
