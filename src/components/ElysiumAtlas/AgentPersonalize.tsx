"use client";
import AgentPersonality from "./AgentPersonality";

interface AgentPersonalizeProps {
  avatarFile: File | null;
  setAvatarFile: (file: File | null) => void;
  clearSignal: number;
}

export default function AgentPersonalize({
  avatarFile,
  setAvatarFile,
  clearSignal,
}: AgentPersonalizeProps) {
  return (
    <div className="mt-6">
      <AgentPersonality
        avatarFile={avatarFile}
        setAvatarFile={setAvatarFile}
        clearSignal={clearSignal}
      />
    </div>
  );
}
